import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import TemplateModel from "@/mongodb/models/Template";
import mongoose from "mongoose";
// We need to import the data. 
// Since template-config.ts might have relative imports or be client-side only (unlikely), we try to import it.
// If this fails build, we'll hardcode. But it should work.
import { TEMPLATES } from "@/app/dashboard/templates/template-config";

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const Template = mongoose.models.Template || TemplateModel;
        if (!Template) {
            return NextResponse.json({ error: "Template model not ready" }, { status: 500 });
        }

        // Security: In production, protect this. For specific user session:
        // const auth = await verifyAuth(); if (!auth) ...

        await Template.deleteMany({ createdBy: 'system' });

        for (const tpl of TEMPLATES) {
            await Template.create({
                title: tpl.name, // Mapping name -> title
                description: tpl.description,
                category: tpl.category,
                steps: tpl.steps.map(step => ({
                    id: step.id,
                    name: step.name,
                    description: step.description,
                    required: step.isRequired,
                    proofType: step.proofType,
                    icon: step.icon
                })),
                createdBy: 'system',
                createdAt: new Date()
            });
        }

        return NextResponse.json({ success: true, count: TEMPLATES.length });
    } catch (error) {
        console.error("Seeding Error:", error);
        return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
    }
}
