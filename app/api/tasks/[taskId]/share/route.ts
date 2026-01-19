import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import ProofLink from "@/mongodb/models/ProofLink";
import Task from "@/mongodb/models/Task";
import AuditLog from "@/mongodb/models/AuditLog";
import { verifyAuth } from "@/lib/auth-server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { taskId } = await params;
        await connectDB();

        const link = await ProofLink.findOne({ taskId, userId: authUser.uid });
        return NextResponse.json(link || { visibility: 'private', isActive: false });

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { taskId } = await params;
        const body = await req.json();
        const { visibility, allowedEmails } = body;

        if (!['private', 'restricted', 'public'].includes(visibility)) {
            return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
        }

        await connectDB();

        // Check task ownership
        const task = await Task.findOne({ _id: taskId, userId: authUser.uid });
        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // Upsert ProofLink
        let link = await ProofLink.findOne({ taskId });
        const isNew = !link;
        const previousVisibility = link?.visibility;

        if (!link) {
            link = await ProofLink.create({
                taskId,
                userId: authUser.uid,
                visibility,
                allowedEmails: allowedEmails || [],
                isActive: true
            });
        } else {
            link.visibility = visibility;
            if (allowedEmails !== undefined) link.allowedEmails = allowedEmails;
            link.updatedAt = new Date();
            await link.save();
        }

        // Log if visibility changed
        if (isNew || previousVisibility !== visibility) {
            const { createAuditEntry } = await import("@/lib/audit");
            await createAuditEntry({
                userId: authUser.uid,
                taskId,
                action: "PROOF_LINK_UPDATED",
                details: `Proof link visibility set to ${visibility}`,
                metadata: {
                    previousVisibility,
                    newVisibility: visibility,
                    allowedEmailsCount: allowedEmails?.length || 0
                }
            });
        }

        return NextResponse.json(link);

    } catch (error) {
        console.error("Share API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
