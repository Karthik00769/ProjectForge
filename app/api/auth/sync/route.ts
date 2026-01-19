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

        // Connect to MongoDB
        await connectDB();

        // Force refresh model if existing to ensure latest schema
        if (mongoose.models.User) delete mongoose.models.User;
        const User = (await import("@/mongodb/models/User")).default;

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
    } catch (error) {
        console.error("Auth sync error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
