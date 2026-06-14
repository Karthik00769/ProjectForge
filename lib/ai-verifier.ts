import connectDB from "@/mongodb/db";
import mongoose from "mongoose";
import { extractTextFromBuffer, callGemini } from "./gemini";
import { createAuditEntry } from "./audit";

export async function analyzeProof(proofId: string, buffer: Buffer, mimeType: string, templateSteps: any[] | undefined) {
    try {
        // Ensure DB
        await connectDB();

        const Proof = mongoose.models.Proof || (await import("@/mongodb/models/Proof")).default;

        // Basic validation
        if (!Proof) {
            console.error("AI Verifier: Proof model not available");
            return;
        }

        const proof = await Proof.findById(proofId);
        if (!proof) {
            console.error("AI Verifier: proof not found", proofId);
            return;
        }

        // 1) Extract any text (OCR)
        let extractedText = "";
        try {
            extractedText = await extractTextFromBuffer(buffer, mimeType);
        } catch (e) {
            console.warn("AI Verifier: OCR failed", e);
            extractedText = "";
        }

        // 2) Build prompt for Gemini
        const stepNames = (templateSteps || []).map((s: any) => s.name || s.id).slice(0, 20);

        const prompt = `You are an assistant that reviews proof evidence for a task.\n` +
            `Task expects the following steps: ${JSON.stringify(stepNames)}\n\n` +
            `Here is the OCR-extracted text from the uploaded proof (if any):\n${extractedText}\n\n` +
            `Based on the visible evidence and extracted text, return a JSON object with keys:\n` +
            `- confidence: number (0-100)\n` +
            `- matchedSteps: array of step names that appear supported by the evidence\n` +
            `- missingSteps: array of step names that are not evident\n` +
            `- summary: short human-readable summary (1-2 sentences)\n` +
            `- recommendation: one of ["Manual Review","Acceptable Evidence","Needs More Evidence"]\n\n` +
            `Return ONLY the JSON object. Do not include any explanation or the prompt.`;

        const contents = [{ parts: [{ text: prompt }] }];

        let geminiResult: any = null;
        try {
            geminiResult = await callGemini(contents);
        } catch (e) {
            console.error("AI Verifier: Gemini call failed", e);
            // Update proof with failure status
            proof.aiVerification = proof.aiVerification || {};
            proof.aiVerification.status = 'analysis_failed';
            await proof.save();

            // Audit entry
            try {
                await createAuditEntry({
                    userId: proof.userId,
                    action: "AI_VERIFICATION_FAILED",
                    details: "Gemini analysis failed or timed out",
                    taskId: proof.taskId?.toString(),
                    metadata: { proofId: proof._id }
                });
            } catch (ae) {
                console.error("AI Verifier: failed to create audit entry", ae);
            }
            return;
        }

        const text = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsed: any = null;
        try {
            parsed = JSON.parse(clean);
        } catch (e) {
            console.error("AI Verifier: failed to parse Gemini output", e, clean);
            proof.aiVerification = proof.aiVerification || {};
            proof.aiVerification.status = 'analysis_failed';
            await proof.save();
            try {
                await createAuditEntry({
                    userId: proof.userId,
                    action: "AI_VERIFICATION_FAILED",
                    details: "Gemini returned invalid JSON",
                    taskId: proof.taskId?.toString(),
                    metadata: { proofId: proof._id }
                });
            } catch (ae) {
                console.error("AI Verifier: failed to create audit entry", ae);
            }
            return;
        }

        // Normalize parsed fields
        const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : Number(parsed.confidence) || 0;
        const matchedSteps = Array.isArray(parsed.matchedSteps) ? parsed.matchedSteps : [];
        const missingSteps = Array.isArray(parsed.missingSteps) ? parsed.missingSteps : [];
        const summary = parsed.summary || '';
        const recommendation = parsed.recommendation || 'Manual Review';

        // Update proof with AI results
        proof.aiVerification = {
            status: 'completed',
            confidence,
            matchedSteps,
            missingSteps,
            summary,
            recommendation,
            model: 'gemini',
            analyzedAt: new Date()
        } as any;

        await proof.save();

        // Audit entry
        try {
            await createAuditEntry({
                userId: proof.userId,
                action: "AI_VERIFICATION_GENERATED",
                details: "AI verification generated",
                taskId: proof.taskId?.toString(),
                metadata: { proofId: proof._id, confidence }
            });
        } catch (ae) {
            console.error("AI Verifier: failed to create audit entry", ae);
        }

    } catch (error) {
        console.error("AI Verifier: unexpected error", error);
    }
}

export default { analyzeProof };
