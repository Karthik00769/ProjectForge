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

// GET: Fetch user's templates with proper data isolation
export async function GET(req: NextRequest) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const Template = mongoose.models.Template;
        if (!Template) {
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');

        // CRITICAL FIX: Only return user's own templates + system templates
        const query: any = {
            $or: [
                { userId: authUser.uid }, // User's custom templates
                { isSystemTemplate: true } // Built-in system templates
            ]
        };

        if (category) {
            query.category = category;
        }

        const templates = await withRetry(async () => {
            return await Template.find(query).sort({ createdAt: -1 });
        });

        return NextResponse.json(templates);
    } catch (error) {
        console.error("Error fetching templates:", error);
        return NextResponse.json({ 
            error: "Internal Server Error", 
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}

// POST: Create a custom template with proper user isolation
export async function POST(req: NextRequest) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, description, category, steps } = body;

        if (!title || !category || !steps || !Array.isArray(steps)) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectDB();

        const Template = mongoose.models.Template;
        if (!Template) {
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const newTemplate = await withRetry(async () => {
            return await Template.create({
                userId: authUser.uid, // CRITICAL: Ensure user ownership
                title,
                description,
                category,
                steps,
                createdBy: authUser.uid, // Keep for backward compatibility
                isSystemTemplate: false, // User-created template
            });
        });

        return NextResponse.json({ template: newTemplate }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating template:", error);
        return NextResponse.json({ 
            error: "Internal Server Error", 
            details: error.message || "Unknown error"
        }, { status: 500 });
    }
}
