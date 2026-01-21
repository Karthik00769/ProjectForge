import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import ProofLinkModel from "@/mongodb/models/ProofLink";
import TaskModel from "@/mongodb/models/Task";
import AuditLogModel from "@/mongodb/models/AuditLog";
import { verifyAuth } from "@/lib/auth-server";
import mongoose from "mongoose";

export async function GET(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { taskId } = await params;
        await connectDB();

        const ProofLink = mongoose.models.ProofLink || ProofLinkModel;
        const link = await ProofLink.findOne({ taskId, userId: authUser.uid });
        return NextResponse.json(link || { visibility: 'private', isActive: false });

    } catch (error) {
        console.error("Share GET Error:", error);
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
        const { visibility } = body; // REMOVED: allowedEmails

        if (!['private', 'restricted', 'public'].includes(visibility)) {
            return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
        }

        await connectDB();

        // Robust model access
        const Task = mongoose.models.Task || TaskModel;
        const ProofLink = mongoose.models.ProofLink || ProofLinkModel;

        if (!Task || !ProofLink) {
            return NextResponse.json({ error: "Server Configuration Error: Models not ready." }, { status: 500 });
        }

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
                // REMOVED: allowedEmails
                isActive: true
            });
        } else {
            link.visibility = visibility;
            // REMOVED: allowedEmails update
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
                    newVisibility: visibility
                    // REMOVED: allowedEmailsCount
                }
            });
        }

        return NextResponse.json(link);

    } catch (error) {
        console.error("Share API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
