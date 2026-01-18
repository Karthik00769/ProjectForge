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

        // Optionally fetch proofs if needed separate or populate
        // const proofs = await Proof.find({ taskId: task._id });

        return NextResponse.json(task);
    } catch (error) {
        console.error("Error fetching task:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
