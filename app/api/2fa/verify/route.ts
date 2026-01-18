import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-server";
import connectDB from "@/mongodb/db";
import User from "@/mongodb/models/User";
import speakeasy from "speakeasy";
import { encrypt } from "@/lib/crypto";
import { createAuditEntry } from "@/lib/audit";

export async function POST(req: NextRequest) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { secret, token } = await req.json();
        if (!secret || !token) {
            return NextResponse.json({ error: "Secret and Token are required" }, { status: 400 });
        }

        // Verify the token
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 2 // Allow for 60s clock drift
        });

        if (!verified) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
        }

        await connectDB();
        const user = await User.findOne({ uid: authUser.uid });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Enable 2FA
        user.twoFactorEnabled = true;
        user.twoFactorMethod = 'totp';
        user.twoFactorSecret = encrypt(secret);
        user.twoFactorEnabledAt = new Date();
        await user.save();

        // Log the event using the secure utility
        await createAuditEntry({
            userId: user.uid,
            action: "2FA_ENABLED",
            details: "Two-Factor Authentication has been enabled (Authenticator App)",
            metadata: {
                method: "TOTP"
            }
        });

        return NextResponse.json({ message: "2FA enabled successfully" });

    } catch (error) {
        console.error("2FA Verify Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
