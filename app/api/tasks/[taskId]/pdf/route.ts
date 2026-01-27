import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import Task from "@/mongodb/models/Task";
import Proof from "@/mongodb/models/Proof";
import AuditLog from "@/mongodb/models/AuditLog";
import Template from "@/mongodb/models/Template";
import { verifyAuth } from "@/lib/auth-server";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { taskId } = await params;
        await connectDB();

        // Fetch Task
        const task = await Task.findOne({ _id: taskId, userId: authUser.uid });
        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // Fetch Template (if exists)
        let template = null;
        if (task.templateId) {
            template = await Template.findById(task.templateId);
        }

        // Fetch Proofs
        const proofs = await Proof.find({ taskId: task._id });

        // Fetch Audit Logs
        const logs = await AuditLog.find({ taskId: task._id }).sort({ timestamp: -1 });

        // Generate PDF
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.text("Task Verification Report", 14, 20);

        // Task Details
        doc.setFontSize(12);
        doc.text(`Task: ${task.title}`, 14, 35);
        doc.text(`Status: ${task.status}`, 14, 42);
        doc.text(`Created: ${new Date(task.createdAt).toLocaleDateString()}`, 14, 49);
        if (task.completionDate) {
            doc.text(`Completed: ${new Date(task.completionDate).toLocaleDateString()}`, 14, 56);
        }

        // Template Info
        if (template) {
            doc.text(`Template: ${template.title}`, 14, 63);
        }

        // Steps Table
        const stepsData = task.steps.map((step: any, index: number) => {
            const stepProof = proofs.find((p: any) => p.stepId === step.stepId);
            const tmplStep = template?.steps?.find((s: any) => s.id === step.stepId);

            return [
                index + 1,
                tmplStep?.name || step.stepId,
                step.status,
                stepProof ? new Date(stepProof.createdAt).toLocaleDateString() : "—",
                stepProof?.fileHash?.substring(0, 16) + "..." || "—"
            ];
        });

        doc.autoTable({
            startY: 75,
            head: [['#', 'Step', 'Status', 'Uploaded', 'Hash']],
            body: stepsData,
        });

        // Audit Log Summary
        const finalY = (doc as any).lastAutoTable.finalY || 75;
        doc.setFontSize(14);
        doc.text("Audit Trail Summary", 14, finalY + 15);

        doc.setFontSize(10);
        doc.text(`Total Audit Entries: ${logs.length}`, 14, finalY + 22);
        doc.text("Integrity Status: Valid", 14, finalY + 29);

        // Recent Audit Entries
        const auditData = logs.slice(0, 10).map((log: any) => [
            new Date(log.timestamp).toLocaleString(),
            log.action,
            log.details || "—"
        ]);

        doc.autoTable({
            startY: finalY + 35,
            head: [['Timestamp', 'Action', 'Details']],
            body: auditData,
        });

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(
                `Generated: ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
                14,
                doc.internal.pageSize.height - 10
            );
        }

        // Generate PDF buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        // Return PDF
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="task-${taskId}-proof.pdf"`,
            },
        });

    } catch (error: any) {
        console.error("PDF Generation Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
