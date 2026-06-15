import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import Task from "@/mongodb/models/Task";
import Proof from "@/mongodb/models/Proof";
import { verifyAuth } from "@/lib/auth-server";

// GET: Fetch single task details
export async function GET(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { taskId } = await params;
        if (!taskId) {
            return NextResponse.json({ error: "Task ID required" }, { status: 400 });
        }

        await connectDB();

        const task = await Task.findOne({ _id: taskId, userId: authUser.uid });

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // Optionally fetch proofs to expose AI verification results per step
        try {
            const proofs = await Proof.find({ taskId: task._id });

            // Merge aiVerification (if present) into task.steps for client convenience
            const enrichedSteps = (task.steps || []).map((s: any) => {
                const stepCopy = { ...s };
                try {
                    if (s.proofId) {
                        const found = proofs.find((p: any) => p._id.toString() === s.proofId.toString());
                        if (found) {
                            stepCopy.aiVerification = found.aiVerification || null;
                            // also expose extractedText if stored on Proof and not on task
                            if (!stepCopy.extractedText && found.extractedText) {
                                stepCopy.extractedText = found.extractedText;
                            }
                        } else {
                            stepCopy.aiVerification = null;
                        }
                    } else {
                        stepCopy.aiVerification = null;
                    }
                } catch (mergeErr) {
                    console.error("Error merging proof aiVerification:", mergeErr);
                    stepCopy.aiVerification = null;
                }
                return stepCopy;
            });

            const response = { ...task.toObject(), steps: enrichedSteps };
            // TEMP DEBUG LOG: print exact task response returned to client (full object)
            try {
                console.log("TASK API RESPONSE:", JSON.stringify(response, null, 2));
            } catch (dbg) {
                console.error("[DEBUG] Failed to stringify full task response:", dbg);
            }
            // TEMP DEBUG LOG: also print exact step shapes returned to client
            try {
                console.log("[DEBUG GET /api/tasks/:taskId] Returning task steps keys:", JSON.stringify(response.steps.map((s: any) => ({ keys: Object.keys(s), sample: { stepId: s.stepId, id: s.id, _id: s._id, proofId: s.proofId } })), null, 2));
            } catch (dbg) {
                console.error("[DEBUG] Failed to log response steps:", dbg);
            }
            return NextResponse.json(response);
        } catch (e) {
            console.error("Failed to enrich task with proofs:", e);
            return NextResponse.json(task);
        }
    } catch (error) {
        console.error("Error fetching task:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
