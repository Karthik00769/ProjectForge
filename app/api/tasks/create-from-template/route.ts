import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import TaskModel from "@/mongodb/models/Task";
import { verifyAuth } from "@/lib/auth-server";
import mongoose from "mongoose";
import { createAuditEntry } from "@/lib/audit";

// POST: Create a task from frontend template data (without requiring MongoDB template)
export async function POST(req: NextRequest) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, description, templateData, dueDate } = body;

        if (!templateData || !templateData.steps || !Array.isArray(templateData.steps)) {
            return NextResponse.json({ error: "Template data with steps is required" }, { status: 400 });
        }

        // Connect to MongoDB & load models
        await connectDB();

        const Task = mongoose.models.Task || TaskModel;

        if (!Task) {
            console.error("CRITICAL: Task model missing from registry and fallback");
            return NextResponse.json({ error: "Server Configuration Error: Models not ready." }, { status: 500 });
        }

        // Prepare Steps from Template Data
        const taskSteps = templateData.steps.map((step: any) => ({
            stepId: step.id,
            status: 'pending',
            uploadedAt: null,
        }));

        // Create Task
        const newTask = await Task.create({
            userId: authUser.uid,
            templateId: null, // No MongoDB template reference for frontend templates
            title: title || templateData.name,
            description: description || templateData.description,
            status: 'pending',
            dueDate: dueDate ? new Date(dueDate) : undefined,
            steps: taskSteps,
        });

        // Log Action using secure utility
        await createAuditEntry({
            userId: authUser.uid,
            taskId: newTask._id.toString(),
            action: "TASK_CREATED",
            details: `Task created from template: ${templateData.name}`,
            metadata: {
                templateName: templateData.name,
                templateCategory: templateData.category,
                initialStepCount: taskSteps.length,
                taskName: newTask.title
            }
        });

        return NextResponse.json({ task: newTask }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating task from template:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
