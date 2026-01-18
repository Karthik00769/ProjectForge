import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/mongodb/db";
import { verifyAuth } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Force refresh models to catch schema updates
        if (mongoose.models.Task) delete mongoose.models.Task;
        if (mongoose.models.AuditLog) delete mongoose.models.AuditLog;

        const Task = (await import("@/mongodb/models/Task")).default;
        const AuditLog = (await import("@/mongodb/models/AuditLog")).default;

        await connectDB();

        // Fetch user tasks
        const tasks = await Task.find({ userId: authUser.uid });

        // Calculate stats
        const totalTasks = tasks.length;
        const pendingTasks = tasks.filter((t: any) => t.status === 'pending' || t.status === 'in-progress').length;
        const verifiedTasks = tasks.filter((t: any) => t.status === 'verified' || t.status === 'completed').length;

        // Count security events (Audit Logs)
        const totalEvents = await AuditLog.countDocuments({ userId: authUser.uid });
        const flaggedCount = await AuditLog.countDocuments({ userId: authUser.uid, integrityStatus: 'flagged' });

        // Fetch recent activity from AuditLogs
        const recentLogs = await AuditLog.find({ userId: authUser.uid })
            .sort({ timestamp: -1 })
            .limit(8);

        // Map logs to "Recent Activity" format
        const activity = recentLogs.map((log: any) => ({
            id: log._id,
            title: log.action.replace(/_/g, ' '),
            description: log.details,
            timestamp: log.timestamp,
            status: log.integrityStatus === 'flagged' ? 'Flagged' : (log.entryHash ? 'Signed' : 'Logged'),
        }));

        return NextResponse.json({
            stats: {
                total: totalTasks,
                verified: verifiedTasks,
                pending: pendingTasks,
                flagged: flaggedCount,
                securityEvents: totalEvents
            },
            recentActivity: activity
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
