import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import ProofModel from "@/mongodb/models/Proof";
import ProofLinkModel from "@/mongodb/models/ProofLink";
import TaskModel from "@/mongodb/models/Task"; // Added TaskModel
import { verifyAuth } from "@/lib/auth-server";
import mongoose from "mongoose";

export async function GET(req: NextRequest, { params }: { params: Promise<{ proofId: string }> }) {
    try {
        const { proofId } = await params;
        await connectDB();

        const Proof = mongoose.models.Proof || ProofModel;
        const ProofLink = mongoose.models.ProofLink || ProofLinkModel;
        const Task = mongoose.models.Task || TaskModel; // Initialize Task model

        const proof = await Proof.findById(proofId).select('+fileData');
        if (!proof || !proof.fileData) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // Access Control Logic
        // 1. Try Owner Access
        const authUser = await verifyAuth();
        if (authUser && authUser.uid === proof.userId) {
            // Owner access granted
            return serveFile(proof);
        }

        // 2. Try Public/Shared Access
        // We need to check if this proof belongs to a Task that has an active ProofLink
        // AND validation of that link's visibility rules.

        // Find task for this proof
        const task = await Task.findById(proof.taskId);
        if (!task) {
            return NextResponse.json({ error: "Task context not found" }, { status: 404 });
        }

        // Find proof link for this task
        const link = await ProofLink.findOne({ taskId: task._id, isActive: true });
        if (!link) {
            return NextResponse.json({ error: "Access denied: No active share link" }, { status: 403 });
        }

        if (link.visibility === 'public') {
            // Public access granted
            return serveFile(proof);
        }

        if (link.visibility === 'restricted') {
            // Check if user is logged in AND their email is allowed
            if (!authUser || !authUser.email) {
                return NextResponse.json({ error: "Access denied: Login required" }, { status: 401 });
            }

            const normalizedAllowed = (link.allowedEmails || []).map((e: string) => e.trim().toLowerCase());
            const userEmail = authUser.email.trim().toLowerCase();

            if (normalizedAllowed.includes(userEmail)) {
                return serveFile(proof);
            }
            return NextResponse.json({ error: "Access denied: Email not authorized" }, { status: 403 });
        }

        return NextResponse.json({ error: "Access denied" }, { status: 403 });

    } catch (error) {
        console.error("Download Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

function serveFile(proof: any) {
    const headers = new Headers();
    headers.set("Content-Type", proof.fileType);
    headers.set("Content-Disposition", `inline; filename="${proof.fileName}"`);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(proof.fileData, {
        status: 200,
        headers
    });
}
