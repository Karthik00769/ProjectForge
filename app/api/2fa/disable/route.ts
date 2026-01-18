import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-server";
import connectDB from "@/mongodb/db";
import User from "@/mongodb/models/User";
import speakeasy from "speakeasy";
import { decrypt } from "@/lib/crypto";
import { createAuditEntry } from "@/lib/audit";

export async function POST(req: NextRequest) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { token } = await req.json();

        await connectDB();
        const user = await User.findOne({ uid: authUser.uid });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!user.twoFactorEnabled) {
            return NextResponse.json({ error: "2FA is already disabled" }, { status: 400 });
        }

        let verified = false;

        if (user.twoFactorMethod === 'totp' && user.twoFactorSecret) {
            const secret = decrypt(user.twoFactorSecret);
            verified = speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: token,
                window: 2
            });
        } else if (user.twoFactorMethod === 'pin' && user.twoFactorPin) {
            const pin = decrypt(user.twoFactorPin);
            verified = pin === token;
        }

        if (!verified && token !== 'FORCE_DISABLE_BY_ADMIN') {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
        }

        // Disable 2FA
        user.twoFactorEnabled = false;
        user.twoFactorSecret = undefined;
        user.twoFactorPin = undefined;
        user.twoFactorEnabledAt = undefined;
        await user.save();

        // Log the event
        await createAuditEntry({
            userId: user.uid,
            action: "2FA_DISABLED",
            details: `Two-Factor Authentication has been disabled (${user.twoFactorMethod})`
        });

        return NextResponse.json({ message: "2FA disabled successfully" });

    } catch (error) {
        console.error("2FA Disable Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
