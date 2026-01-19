import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-server";
import connectDB from "@/mongodb/db";
import UserModel from "@/mongodb/models/User";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

        // Generate a new secret
        const secret = speakeasy.generateSecret({
            length: 20,
            name: `ProjectForge (${user.email})`,
            issuer: "ProjectForge"
        });

        // We don't save it yet. We only save after verification.
        // We send the OTPAuth URL for QR code and the base32 secret for manual entry.
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

        return NextResponse.json({
            secret: secret.base32,
            qrCode: qrCodeUrl,
            otpauthUrl: secret.otpauth_url
        });

    } catch (error) {
        console.error("2FA Setup Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
