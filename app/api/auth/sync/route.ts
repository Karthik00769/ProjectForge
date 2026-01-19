import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDB from "@/mongodb/db";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];

        // Verify Firebase Token
        const decodedToken = await adminAuth.verifyIdToken(token);
        const { uid, email, name, picture } = decodedToken;
        const body = await req.json().catch(() => ({}));
        const inputName = body.displayName || name;
        const inputPicture = body.photoURL || picture;

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Connect to MongoDB & load models
        await connectDB();

        // NUCLEAR OPTION: Define User model inline if it doesn't exist
        let User;
        if (mongoose.models.User) {
            User = mongoose.models.User;
        } else {
            const UserSchema = new mongoose.Schema({
                uid: { type: String, required: true, unique: true },
                email: { type: String, required: true, unique: true },
                displayName: { type: String },
                photoURL: { type: String },
                role: { type: String, default: 'user' },
                credits: { type: Number, default: 0 },
                twoFactorEnabled: { type: Boolean, default: false },
                twoFactorMethod: { type: String, default: 'totp' },
                twoFactorSecret: { type: String, required: false },
                twoFactorPin: { type: String, required: false },
                twoFactorEnabledAt: { type: Date, required: false },
                isDeleted: { type: Boolean, default: false },
                deletedAt: { type: Date },
                createdAt: { type: Date, default: Date.now },
                updatedAt: { type: Date, default: Date.now },
            });
            User = mongoose.model('User', UserSchema);
        }

        console.log("[AuthSync] User model status:", !!User, typeof User?.create);

        // Find or Create User
        let user = await User.findOne({ uid });

        if (!user) {
            user = await User.create({
                uid,
                email,
                displayName: inputName || email.split("@")[0],
                photoURL: inputPicture,
                role: "user",
                credits: 0,
            });
            console.log(`New user created: ${email}`);
        } else {
            // Update existing user details to stay in sync
            user.displayName = inputName || user.displayName;
            user.photoURL = inputPicture || user.photoURL;
            await user.save();
        }

        return NextResponse.json({
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: user.role,
                twoFactorEnabled: user.twoFactorEnabled
            }
        });

    } catch (error: any) {
        console.error("Auth Sync Error:", error);
        if (error.message.includes("whitelist")) {
            return NextResponse.json({
                error: "Database connection failed. Please ensure your IP is whitelisted in MongoDB Atlas.",
                details: "Whitelist error detected in backend logs."
            }, { status: 503 });
        }
        return NextResponse.json({
            error: "Internal Server Error",
            details: error.message
        }, { status: 500 });
    }
}
