import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-server";
import connectDB from "@/mongodb/db";
import User from "@/mongodb/models/User";
import { encrypt } from "@/lib/crypto";
import { createAuditEntry } from "@/lib/audit";

export async function POST(req: NextRequest) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { pin } = await req.json();
        if (!pin || pin.length !== 6) {
            return NextResponse.json({ error: "6-digit PIN is required" }, { status: 400 });
        }

        await connectDB();
        const user = await User.findOne({ uid: authUser.uid });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Enable 2FA with PIN
        user.twoFactorEnabled = true;
        user.twoFactorMethod = 'pin';
        user.twoFactorPin = encrypt(pin);
        user.twoFactorEnabledAt = new Date();
        user.twoFactorSecret = undefined; // Clear TOTP secret if switching
        await user.save();

        // Log the event
        await createAuditEntry({
            userId: user.uid,
            action: "2FA_ENABLED",
            details: "Two-Factor Authentication has been enabled (Security PIN)",
            metadata: {
                method: "PIN"
            }
        });

        return NextResponse.json({ message: "2FA PIN enabled successfully" });

    } catch (error) {
        console.error("2FA PIN Setup Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
