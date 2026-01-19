import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDB from "@/mongodb/db";
import mongoose from "mongoose";
import UserModel from "@/mongodb/models/User";

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

        // LOGGING FOR BINARY PROOF (As requested by user)
        console.log("[AuthSync] mongoose.models keys:", Object.keys(mongoose.models));
        console.log("[AuthSync] UserModel (static import):", !!UserModel);
        console.log("[AuthSync] mongoose.models.User:", !!mongoose.models.User);

        const User = mongoose.models.User || UserModel;

        if (!User) {
            console.error("CRITICAL: User model remains undefined after initialization attempts.");
            return NextResponse.json({ error: "Server Configuration Error: User model could not be initialized." }, { status: 500 });
        }

        console.log("[AuthSync] Final User model defined:", !!User);
        if (typeof User.create !== 'function') {
            console.error("CRITICAL: User.create is NOT a function!", typeof User.create);
        }

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

        // Return user object, force toObject to bypass any Mongoose internal issues
        return NextResponse.json({ user: user.toObject() });
    } catch (error: any) {
        console.error("CRITICAL: Auth sync error:", {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        if (error.message.includes("whitelist")) {
            return NextResponse.json({
                error: "Database connection failed. Please ensure your IP is whitelisted in MongoDB Atlas.",
                details: "Whitelist error detected in backend logs."
            }, { status: 503 });
        }
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
