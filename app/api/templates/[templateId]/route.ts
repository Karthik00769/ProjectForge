import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import TemplateModel from "@/mongodb/models/Template";
import { verifyAuth } from "@/lib/auth-server";
import mongoose from "mongoose";

// Utility function for network-safe requests with retry logic
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await Promise.race([
                operation(),
                new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), 10000)
                )
            ]);
        } catch (error) {
            lastError = error as Error;
            if (attempt === maxRetries) break;
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
    }
    
    throw lastError!;
}

// GET: Fetch specific template with proper data isolation
export async function GET(req: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { templateId } = await params;
        
        if (!templateId || !mongoose.Types.ObjectId.isValid(templateId)) {
            return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
        }

        await connectDB();

        const Template = mongoose.models.Template || TemplateModel;
        if (!Template) {
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        // CRITICAL FIX: Enforce data isolation - user can only access their own templates or system templates
        const template = await withRetry(async () => {
            return await Template.findOne({
                _id: templateId,
                $or: [
                    { userId: authUser.uid }, // User's own template
                    { isSystemTemplate: true } // System template
                ]
            });
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        return NextResponse.json(template);
    } catch (error) {
        console.error("Error fetching template:", error);
        return NextResponse.json({ 
            error: "Internal Server Error", 
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}

// PUT: Update template with proper ownership validation
export async function PUT(req: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { templateId } = await params;
        
        if (!templateId || !mongoose.Types.ObjectId.isValid(templateId)) {
            return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
        }

        const body = await req.json();
        const { title, description, category, steps } = body;

        if (!title || !category || !steps || !Array.isArray(steps)) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectDB();

        const Template = mongoose.models.Template || TemplateModel;
        if (!Template) {
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        // CRITICAL FIX: Only allow users to update their own templates (not system templates)
        const updatedTemplate = await withRetry(async () => {
            return await Template.findOneAndUpdate(
                { 
                    _id: templateId, 
                    userId: authUser.uid, // MUST be user's own template
                    isSystemTemplate: false // Cannot update system templates
                },
                {
                    title,
                    description,
                    category,
                    steps,
                    updatedAt: new Date()
                },
                { new: true }
            );
        });

        if (!updatedTemplate) {
            return NextResponse.json({ error: "Template not found or access denied" }, { status: 404 });
        }

        return NextResponse.json({ template: updatedTemplate });
    } catch (error) {
        console.error("Error updating template:", error);
        return NextResponse.json({ 
            error: "Internal Server Error", 
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}

// DELETE: Delete template with proper ownership validation
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { templateId } = await params;
        
        if (!templateId || !mongoose.Types.ObjectId.isValid(templateId)) {
            return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
        }

        await connectDB();

        const Template = mongoose.models.Template || TemplateModel;
        if (!Template) {
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        // CRITICAL FIX: Only allow users to delete their own templates (not system templates)
        const deletedTemplate = await withRetry(async () => {
            return await Template.findOneAndDelete({
                _id: templateId,
                userId: authUser.uid, // MUST be user's own template
                isSystemTemplate: false // Cannot delete system templates
            });
        });

        if (!deletedTemplate) {
            return NextResponse.json({ error: "Template not found or access denied" }, { status: 404 });
        }

        return NextResponse.json({ message: "Template deleted successfully" });
    } catch (error) {
        console.error("Error deleting template:", error);
        return NextResponse.json({ 
            error: "Internal Server Error", 
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}