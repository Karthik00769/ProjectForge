import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import AuditLog from "@/mongodb/models/AuditLog";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const logs = await AuditLog.find({}).limit(10);
        return NextResponse.json({
            logs: logs.map(l => ({
                id: l._id,
                action: l.action,
                entryHash: l.entryHash,
                hasEntryHash: !!l.entryHash,
                raw: l.toObject()
            }))
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
