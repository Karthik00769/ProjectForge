import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import mongoose from "mongoose";
import { verifyAuth } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Force refresh model
        if (mongoose.models.AuditLog) delete mongoose.models.AuditLog;
        const AuditLog = (await import("@/mongodb/models/AuditLog")).default;

        await connectDB();

        const { searchParams } = new URL(req.url);
        const taskId = searchParams.get('taskId');

        const query: any = { userId: authUser.uid };
        if (taskId) {
            query.taskId = taskId;
        }

        const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(100);

        return NextResponse.json(logs);

    } catch (error) {
        console.error("Audit Logs Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
