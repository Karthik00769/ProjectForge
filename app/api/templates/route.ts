import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import TemplateModel from "@/mongodb/models/Template";
import { verifyAuth } from "@/lib/auth-server";
import mongoose from "mongoose";

// GET: Fetch all templates
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const Template = mongoose.models.Template || TemplateModel;
        if (!Template) {
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');

        const query = category ? { category } : {};

        const templates = await Template.find(query).sort({ createdAt: -1 });

        return NextResponse.json(templates);
    } catch (error) {
        console.error("Error fetching templates:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Create a custom template
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

        const Template = mongoose.models.Template || TemplateModel;
        if (!Template) {
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const newTemplate = await Template.create({
            title,
            description,
            category,
            steps, // Ensure steps match the schema structure on frontend
            createdBy: authUser.uid,
        });

        return NextResponse.json({ template: newTemplate }, { status: 201 });
    } catch (error) {
        console.error("Error creating template:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
