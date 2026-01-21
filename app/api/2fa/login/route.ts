import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-server";
import connectDB from "@/mongodb/db";
import UserModel from "@/mongodb/models/User";
// REMOVED: import speakeasy - no longer using TOTP/Authenticator apps
import { decrypt } from "@/lib/crypto";
import { createAuditEntry } from "@/lib/audit";
import { getClientInfo } from "@/lib/client-info";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { token } = await req.json();
        if (!token) {
            return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
        }

        await connectDB();

        const User = mongoose.models.User;
        if (!User) {
            return NextResponse.json({ error: "Server Configuration Error: User model not ready." }, { status: 500 });
        }

        const user = await User.findOne({ uid: authUser.uid });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!user.twoFactorEnabled) {
            return NextResponse.json({ error: "2FA is not enabled for this account" }, { status: 400 });
        }

        const { ipHash, deviceFingerprintHash } = getClientInfo(req);
        let verified = false;

        // SECURITY PIN ONLY - REMOVED TOTP/Authenticator App Support
        if (user.twoFactorMethod === 'pin' && user.twoFactorPin) {
            const pin = decrypt(user.twoFactorPin);
            verified = pin === token;
        } else {
            // If user somehow has old TOTP method, reject
            return NextResponse.json({ error: "Invalid 2FA method. Please re-enable 2FA with Security PIN." }, { status: 400 });
        }

        if (!verified) {
            // Log failed attempt with evidentiary proof
            await createAuditEntry({
                userId: user.uid,
                action: "2FA_FAILED_ATTEMPT",
                details: `Incorrect Security PIN entered during login`,
                entityType: 'USER',
                entityId: user._id.toString(),
                ipHash,
                deviceFingerprintHash,
                metadata: {
                    method: 'pin'
                }
            });

            return NextResponse.json({ error: `Invalid Security PIN` }, { status: 401 });
        }

        // 2FA Success
        await createAuditEntry({
            userId: user.uid,
            action: "LOGIN_2FA_SUCCESS",
            details: "Two-factor authentication verified successfully",
            entityType: 'USER',
            entityId: user._id.toString(),
            ipHash,
            deviceFingerprintHash
        });

        return NextResponse.json({ success: true, message: "2FA verified" });

    } catch (error) {
        console.error("2FA Login Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
