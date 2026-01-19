import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-server";
import connectDB from "@/mongodb/db";
import UserModel from "@/mongodb/models/User";
import TaskModel from "@/mongodb/models/Task";
import ProofModel from "@/mongodb/models/Proof";
import ProofLinkModel from "@/mongodb/models/ProofLink";
import { adminAuth } from "@/lib/firebase-admin";
import { getClientInfo } from "@/lib/client-info";
import { createAuditEntry } from "@/lib/audit";
import mongoose from "mongoose";

import { decrypt } from "@/lib/crypto";
import speakeasy from "speakeasy";

export async function DELETE(req: NextRequest) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Robust model access
        const User = mongoose.models.User || UserModel;
        const Task = mongoose.models.Task || TaskModel;
        const Proof = mongoose.models.Proof || ProofModel;
        const ProofLink = mongoose.models.ProofLink || ProofLinkModel;

        if (!User || !Task || !Proof || !ProofLink) {
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const user = await User.findOne({ uid: authUser.uid });
        if (!user || user.isDeleted) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { ipHash, deviceFingerprintHash } = getClientInfo(req);
        const { twoFactorToken } = await req.json().catch(() => ({}));

        // Mandatory 2FA Check for Deletion if enabled
        if (user.twoFactorEnabled) {
            if (!twoFactorToken) {
                return NextResponse.json({ error: "2FA token required for account deletion" }, { status: 401 });
            }

            let verified = false;
            if (user.twoFactorMethod === 'totp' && user.twoFactorSecret) {
                const secret = decrypt(user.twoFactorSecret);
                verified = speakeasy.totp.verify({
                    secret,
                    encoding: 'base32',
                    token: twoFactorToken,
                    window: 2
                });
            } else if (user.twoFactorMethod === 'pin' && user.twoFactorPin) {
                const pin = decrypt(user.twoFactorPin);
                verified = pin === twoFactorToken;
            }

            if (!verified) {
                await createAuditEntry({
                    userId: authUser.uid,
                    action: "DELETE_ACCOUNT_FAILED_2FA",
                    details: "Incorrect 2FA token provided for account deletion attempt",
                    entityType: 'USER',
                    entityId: user._id.toString(),
                    ipHash,
                    deviceFingerprintHash
                });
                return NextResponse.json({ error: "Invalid 2FA code. Deletion aborted." }, { status: 401 });
            }
        }

        // 1. Log the deletion - mandatory for audit integrity
        await createAuditEntry({
            userId: authUser.uid,
            action: "ACCOUNT_DELETED",
            details: `User ${user.email} initiated permanent account deletion`,
            entityType: 'USER',
            entityId: user._id.toString(),
            ipHash,
            deviceFingerprintHash
        });

        // 2. Clear sensitive user data but keep the record (Soft Delete)
        // We delete Tasks and Proofs as requested, but we MUST keep AuditLogs.
        await Task.deleteMany({ userId: authUser.uid });
        await Proof.deleteMany({ userId: authUser.uid });
        await ProofLink.deleteMany({ userId: authUser.uid });

        // Mark as deleted and clear personal info
        user.isDeleted = true;
        user.deletedAt = new Date();
        user.email = `deleted_${authUser.uid}@projectforge.internal`; // Anonymize email
        user.displayName = "Deleted User";
        user.photoURL = "";
        user.twoFactorEnabled = false;
        user.twoFactorSecret = undefined;
        user.twoFactorPin = undefined;
        await user.save();

        // 3. Delete user from Firebase Auth to prevent further login
        try {
            await adminAuth.deleteUser(authUser.uid);
        } catch (fbError) {
            console.error("Firebase User Deletion Error:", fbError);
        }

        return NextResponse.json({ message: "Account deleted and records secured." });

    } catch (error) {
        console.error("Account Deletion Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
