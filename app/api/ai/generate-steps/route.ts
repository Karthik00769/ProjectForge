import { NextRequest, NextResponse } from "next/server";
import { generateSteps } from "@/lib/gemini";

// AI Use Case 1: Step Suggestion
// Input: { jobTitle: string }
// Output: steps[] { title, description }

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { jobTitle } = body;

        if (!jobTitle) {
            return NextResponse.json({ error: "Job title is required" }, { status: 400 });
        }

        const steps = await generateSteps(jobTitle);

        return NextResponse.json({ steps });
    } catch (error) {
        console.error("Generate Steps API Error:", error);
        return NextResponse.json({ error: "Failed to generate steps" }, { status: 500 });
    }
}
