import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDB from "@/mongodb/db";
import AuditLog from "@/mongodb/models/AuditLog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("Authorization") || req.nextUrl.searchParams.get("token");

    if (!authHeader) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const token = authHeader.replace("Bearer ", "");
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        await connectDB();

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const send = (data: any) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                };

                // Initial heartbeat
                send({ type: "connected", timestamp: new Date().toISOString() });

                let lastSeenTimestamp = new Date();

                // Poll the DB internally for changes to this user's audit logs
                // This is better than frontend polling as it's a single open connection
                const interval = setInterval(async () => {
                    try {
                        const latestLog = await AuditLog.findOne({ userId })
                            .sort({ timestamp: -1 })
                            .select("timestamp action");

                        if (latestLog && latestLog.timestamp > lastSeenTimestamp) {
                            lastSeenTimestamp = latestLog.timestamp;
                            send({
                                type: "update",
                                action: latestLog.action,
                                timestamp: latestLog.timestamp
                            });
                        }
                    } catch (e) {
                        console.error("SSE Poll error:", e);
                    }
                }, 3000); // Check every 3 seconds server-side

                // Handle close
                req.signal.addEventListener("abort", () => {
                    clearInterval(interval);
                    controller.close();
                });
            },
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
            },
        });
    } catch (e) {
        return new NextResponse("Unauthorized", { status: 401 });
    }
}
