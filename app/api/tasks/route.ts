import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import TaskModel from "@/mongodb/models/Task";
import TemplateModel from "@/mongodb/models/Template";
import { verifyAuth } from "@/lib/auth-server";
import mongoose from "mongoose";
import { createAuditEntry } from "@/lib/audit";

// POST: Create a task from a template
export async function POST(req: NextRequest) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { templateId, title, dueDate } = body;

        if (!templateId) {
            return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
        }

        await connectDB();

        // Robust model access
        const Task = mongoose.models.Task || TaskModel;
        const Template = mongoose.models.Template || TemplateModel;

        if (!Task || !Template) {
            console.error("CRITICAL: Task or Template model is undefined");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        // 1. Fetch Template
        const template = await Template.findById(templateId);
        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        // 2. Prepare Steps from Template
        const taskSteps = template.steps.map((step: any) => ({
            stepId: step.id, // Keep the template's step ID for reference
            status: 'pending',
            uploadedAt: null,
        }));

        // 3. Create Task
        const newTask = await Task.create({
            userId: authUser.uid,
            templateId: template._id,
            title: title || template.title, // Allow custom title override
            description: template.description,
            status: 'pending',
            dueDate: dueDate ? new Date(dueDate) : undefined,
            steps: taskSteps,
        });

        // 4. Log Action using secure utility
        await createAuditEntry({
            userId: authUser.uid,
            taskId: newTask._id,
            action: "TASK_CREATED",
            details: `Task created using template: ${template.title}`,
            metadata: {
                templateId: template._id,
                initialStepCount: taskSteps.length,
                taskName: newTask.title
            }
        });

        return NextResponse.json({ task: newTask }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating task:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}

// GET: Fetch user's tasks
export async function GET(req: NextRequest) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Robust model access
        const Task = mongoose.models.Task || TaskModel;
        if (!Task) {
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const tasks = await Task.find({ userId: authUser.uid }).sort({ createdAt: -1 });

        return NextResponse.json(tasks);
    } catch (error: any) {
        console.error("Error fetching tasks:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
