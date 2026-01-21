import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import TaskModel from "@/mongodb/models/Task";
import ProofModel from "@/mongodb/models/Proof";
import ProofLinkModel from "@/mongodb/models/ProofLink";
import { verifyAuth } from "@/lib/auth-server";
import crypto from "crypto";
import { extractTextFromBuffer } from "@/lib/gemini";
import { createAuditEntry } from "@/lib/audit";
import mongoose from "mongoose";

export async function POST(req: NextRequest, { params }: { params: Promise<{ taskId: string; stepId: string }> }) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { taskId, stepId } = await params;

        // Parse FormData
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Phase 8: File Type Validation
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!ALLOWED_TYPES.includes(file.type)) {
            await connectDB(); // Ensure DB is connected for logging
            await createAuditEntry({
                userId: authUser.uid,
                taskId: taskId,
                action: "UPLOAD_REJECTED",
                details: `Invalid file type attempted: ${file.type}`,
                metadata: { stepId, fileName: file.name }
            });
            return NextResponse.json({ error: "Invalid file type. Only Images and PDFs are allowed." }, { status: 400 });
        }

        // 1. Generate File Hash (SHA-256)
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

        // AI Use Case 2: Basic Proof Text Extraction (OCR)
        const extractedText = await extractTextFromBuffer(buffer, file.type);

        // 2. "Upload" File (Mocking cloud storage URL)
        const fileUrl = `https://mock-storage.com/${authUser.uid}/${taskId}/${stepId}/${file.name}`;

        await connectDB();

        // Robust model access
        const Task = mongoose.models.Task || TaskModel;
        const Proof = mongoose.models.Proof || ProofModel;
        const ProofLink = mongoose.models.ProofLink || ProofLinkModel;

        if (!Task || !Proof || !ProofLink) {
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        // 3. Verify Task Ownership & Status
        const task = await Task.findOne({ _id: taskId, userId: authUser.uid });
        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        const stepIndex = task.steps.findIndex((s: any) => s.stepId === stepId);
        if (stepIndex === -1) {
            return NextResponse.json({ error: "Step not found" }, { status: 404 });
        }

        // FILE REPLACEMENT DETECTION
        const existingHash = task.steps[stepIndex].fileHash;
        let isReplacement = false;

        if (task.steps[stepIndex].status === "completed" && existingHash) {
            // File is being replaced - check if hash changed
            if (existingHash !== fileHash) {
                isReplacement = true;

                // FLAG THE TASK
                task.status = "flagged";
                task.flaggedAt = new Date();

                // Log file replacement with old and new hash
                await createAuditEntry({
                    userId: authUser.uid,
                    taskId: task._id.toString(),
                    action: "FILE_REPLACED",
                    details: `File replaced for step: ${stepId}`,
                    metadata: {
                        stepId,
                        oldHash: existingHash,
                        newHash: fileHash,
                        fileName: file.name
                    },
                    integrityStatus: 'flagged'
                });
            }
        }

        // 4. Create Proof Record
        const proof = await Proof.create({
            userId: authUser.uid,
            taskId: task._id,
            stepId: stepId,
            fileUrl: fileUrl,
            fileName: file.name,
            fileType: file.type,
            fileHash: fileHash,
            extractedText: extractedText,
        });

        // 5. Update Task Step Status
        task.steps[stepIndex].status = "completed";
        task.steps[stepIndex].proofId = proof._id;
        task.steps[stepIndex].uploadedAt = new Date();
        task.steps[stepIndex].fileHash = fileHash; // Store hash for future comparison

        // Check if all steps are completed (only if not flagged)
        if (!isReplacement) {
            const allCompleted = task.steps.every((s: any) => s.status === "completed");
            if (allCompleted) {
                task.status = "completed";
                task.completionDate = new Date();
            } else {
                task.status = "in-progress";
            }
        }

        await task.save();

        // 6. Log Audit Trail (Immutable)
        await createAuditEntry({
            userId: authUser.uid,
            taskId: task._id.toString(),
            action: "PROOF_UPLOADED",
            details: `Proof uploaded for step: ${stepId}`,
            metadata: {
                stepId,
                proofId: proof._id,
                fileHash, // Critical for verification
                fileName: file.name,
                taskName: task.title
            }
        });

        // Check if task was completed (not flagged)
        const allCompleted = task.status === 'completed';

        if (allCompleted) {
            await createAuditEntry({
                userId: authUser.uid,
                taskId: task._id.toString(),
                action: "TASK_COMPLETED",
                details: `All steps completed for task: ${task.title || taskId}`,
                metadata: {
                    completionDate: task.completionDate,
                    taskName: task.title
                }
            });

            // Phase 6: Proof link auto-generated (default visibility = private)
            const existingLink = await ProofLink.findOne({ taskId: task._id });
            if (!existingLink) {
                const newLink = await ProofLink.create({
                    taskId: task._id,
                    userId: authUser.uid,
                    visibility: 'private', // Default as per spec
                    isActive: true
                });

                await createAuditEntry({
                    userId: authUser.uid,
                    taskId: task._id.toString(),
                    action: "PROOF_LINK_GENERATED",
                    details: "Proof link automatically generated upon task completion",
                    metadata: {
                        proofLinkId: newLink._id,
                        visibility: 'private',
                        taskName: task.title
                    }
                });
            }
        }

        return NextResponse.json({ success: true, proof, taskStatus: task.status });

    } catch (error: any) {
        console.error("Error uploading proof:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
