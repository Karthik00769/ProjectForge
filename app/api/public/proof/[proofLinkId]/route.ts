
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import ProofLink from "@/mongodb/models/ProofLink";
import Task from "@/mongodb/models/Task";
import Proof from "@/mongodb/models/Proof";
import AuditLog from "@/mongodb/models/AuditLog";
import Template from "@/mongodb/models/Template";

export async function GET(req: NextRequest, { params }: { params: Promise<{ proofLinkId: string }> }) {
    try {
        const { proofLinkId } = await params;
        await connectDB();

        // 1. Fetch Proof Link
        const link = await ProofLink.findById(proofLinkId);
        if (!link || !link.isActive) {
            return NextResponse.json({ error: "Proof link not found or expired" }, { status: 404 });
        }

        // 2. Access Control
        if (link.visibility === 'private') {
            return NextResponse.json({ error: "This proof is private" }, { status: 403 });
        }

        if (link.visibility === 'restricted') {
            const queryEmail = req.nextUrl.searchParams.get('email');

            // Secure Email Verification
            // If the user is logged in, use their actual verified email
            let authUser = null;
            try {
                const authHeader = req.headers.get("Authorization");
                if (authHeader) {
                    const { verifyAuth } = await import("@/lib/auth-server");
                    authUser = await verifyAuth();
                }
            } catch (e) {
                console.error("Auth check failed for restricted link:", e);
            }

            const activeEmail = authUser?.email || queryEmail;

            // Normalize emails for comparison
            const allowedEmails = (link.allowedEmails || []).map((e: string) => e.toLowerCase().trim());
            const userEmail = (activeEmail || '').toLowerCase().trim();

            if (!activeEmail || !allowedEmails.includes(userEmail)) {
                return NextResponse.json({
                    error: "Access restricted to allowed emails only.",
                    requiresAuth: !authUser,
                    details: authUser ? "Your email is not on the allowed list." : "Please sign in with an authorized email or provide a valid access email."
                }, { status: 403 });
            }
        }

        // 3. Fetch Task
        const task = await Task.findById(link.taskId);
        if (!task) {
            return NextResponse.json({ error: "Associated task not found" }, { status: 404 });
        }

        // 4. Fetch Template (for name)
        const template = await Template.findOne({ // Use findOne with flexible query if needed, or findById if we stored _id
            $or: [{ _id: task.templateId }, { id: task.templateId }]
        });

        // 5. Fetch Proofs
        const proofs = await Proof.find({ taskId: task._id });

        // 6. Fetch Audit Logs
        const logs = await AuditLog.find({ taskId: task._id }).sort({ timestamp: -1 });

        // 7. Aggregate Data for View
        const stepsData = task.steps.map((step: any) => {
            const stepProof = proofs.find((p: any) => p.stepId === step.stepId);
            const tmplStep = template?.steps?.find((s: any) => s.id === step.stepId);

            return {
                id: step.stepId,
                name: tmplStep?.name || step.stepId, // Fallback if template missing
                status: step.status,
                uploadedFile: stepProof?.fileName,
                uploadedDate: stepProof?.createdAt,
                proofUrl: stepProof?.fileUrl,
                proofId: stepProof?._id // Exposed for file viewing
            };
        });

        // Integrity Score Calculation (Basic Placeholder)
        // If all steps have proofs and all logs valid -> 100%
        const integrityScore = (task.status === 'completed' && logs.length > 0) ? 100 :
            (task.steps.filter((s: any) => s.status === 'completed').length / task.steps.length) * 100;

        const responseData = {
            taskId: task._id,
            taskTitle: template?.name || "Custom Task",
            taskDescription: template?.description,
            templateName: template?.name || "Standard Template",
            status: task.status,
            completionDate: task.completionDate ? new Date(task.completionDate).toLocaleDateString() : null,
            verifiedAt: link.updatedAt,
            integrityScore: Math.round(integrityScore),
            steps: stepsData,
            auditEntries: logs.map((log: any) => ({
                id: log._id,
                action: log.action,
                taskName: template?.name,
                details: log.details,
                stepName: log.metadata?.stepId, // Could map to real name
                proofHash: log.metadata?.fileHash,
                timestamp: log.timestamp,
                integrityStatus: 'verified' // Assumed for phase 1
            }))
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("Public Proof API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
