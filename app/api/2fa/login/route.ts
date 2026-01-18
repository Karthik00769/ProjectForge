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
        if (!token) {
            return NextResponse.json({ error: "TOTP Token is required" }, { status: 400 });
        }

        await connectDB();
        const user = await User.findOne({ uid: authUser.uid });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!user.twoFactorEnabled) {
            return NextResponse.json({ error: "2FA is not enabled for this account" }, { status: 400 });
        }

        let verified = false;

        if (user.twoFactorMethod === 'totp' && user.twoFactorSecret) {
            const secret = decrypt(user.twoFactorSecret);
            // Verify the token
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

        if (!verified) {
            // Log failed attempt
            await createAuditEntry({
                userId: user.uid,
                action: "2FA_FAILED_ATTEMPT",
                details: "Incorrect 2FA code entered during login",
                metadata: {
                    ip: req.headers.get("x-forwarded-for") || "unknown",
                    method: user.twoFactorMethod
                }
            });

            return NextResponse.json({ error: `Invalid ${user.twoFactorMethod === 'pin' ? 'PIN' : '2FA code'}` }, { status: 401 });
        }

        // 2FA Success
        return NextResponse.json({ success: true, message: "2FA verified" });

    } catch (error) {
        console.error("2FA Login Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
