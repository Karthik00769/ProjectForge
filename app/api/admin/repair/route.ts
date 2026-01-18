import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/mongodb/db";
import crypto from "crypto";

export async function GET(req: NextRequest) {
    const logsOut: string[] = [];
    try {
        logsOut.push("Resetting Models...");
        if (mongoose.models.AuditLog) delete mongoose.models.AuditLog;
        if (mongoose.models.User) delete mongoose.models.User;
        if (mongoose.models.Task) delete mongoose.models.Task;

        const AuditLog = (await import("@/mongodb/models/AuditLog")).default;
        const User = (await import("@/mongodb/models/User")).default;
        const Task = (await import("@/mongodb/models/Task")).default;

        await connectDB();

        // 1. Repair Audit Logs
        const logs = await AuditLog.find({}).sort({ timestamp: 1 });
        let previousHash = "0".repeat(64);
        for (const log of logs) {
            const entryData = {
                userId: log.userId,
                action: log.action,
                details: log.details || "",
                taskId: log.taskId ? log.taskId.toString() : "",
                metadata: JSON.stringify(log.metadata || {}),
                previousHash: previousHash,
                timestamp: log.timestamp.toISOString()
            };
            const entryHash = crypto.createHash("sha256").update(JSON.stringify(entryData)).digest("hex");
            log.entryHash = entryHash;
            log.previousHash = previousHash;
            log.integrityStatus = log.integrityStatus || 'valid';
            await log.save();
            previousHash = entryHash;
        }

        // 2. Fix 2FA
        const users = await User.find({});
        for (const u of users) {
            if (u.twoFactorPin || u.twoFactorSecret) {
                u.twoFactorEnabled = true;
                await u.save();
            }
        }

        // 3. SEED TASKS FOR STATS
        const firstUser = await User.findOne({});
        if (firstUser) {
            // Delete existing tasks to start fresh
            await Task.deleteMany({ userId: firstUser.uid });

            await Task.create({
                userId: firstUser.uid,
                title: "Initialize Secure Workspace",
                description: "Setup your profile and enable account protection.",
                status: 'completed',
                completionDate: new Date(),
                steps: [{ stepId: "setup", status: "completed", uploadedAt: new Date() }]
            });

            await Task.create({
                userId: firstUser.uid,
                title: "Review Security Logs",
                description: "Check the audit trail for any suspicious activity.",
                status: 'pending',
                steps: [{ stepId: "review", status: "pending" }]
            });

            logsOut.push("Seeded 2 tasks for user: " + firstUser.email);
        }

        return NextResponse.json({ success: true, logs: logsOut });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
