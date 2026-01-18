import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-server";
import connectDB from "@/mongodb/db";
import User from "@/mongodb/models/User";
import Task from "@/mongodb/models/Task";
import Proof from "@/mongodb/models/Proof";
import AuditLog from "@/mongodb/models/AuditLog";
import ProofLink from "@/mongodb/models/ProofLink";
import { adminAuth } from "@/lib/firebase-admin";
import { createAuditEntry } from "@/lib/audit";

export async function DELETE(req: NextRequest) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const user = await User.findOne({ uid: authUser.uid });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 1. Log the deletion before everything is gone
        await createAuditEntry({
            userId: authUser.uid,
            action: "ACCOUNT_DELETED",
            details: `User ${user.email} initiated account deletion`
        });

        // 2. Delete user's data from database
        await Task.deleteMany({ userId: authUser.uid });
        await Proof.deleteMany({ userId: authUser.uid });
        // NOTE: We might want to keep AuditLogs for legal reasons, but user asked to erase everything.
        // If we want proof of integrity we must keep the chain. 
        // For now, follow "erase all" as requested.
        await AuditLog.deleteMany({ userId: authUser.uid });
        await ProofLink.deleteMany({ userId: authUser.uid });
        await User.deleteOne({ uid: authUser.uid });

        // 3. Delete user from Firebase Auth
        try {
            await adminAuth.deleteUser(authUser.uid);
        } catch (fbError) {
            console.error("Firebase User Deletion Error:", fbError);
        }

        return NextResponse.json({ message: "Account deleted successfully" });

    } catch (error) {
        console.error("Account Deletion Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
