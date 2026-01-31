import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import { verifyAuth } from "@/lib/auth-server";
import TaskModel from "@/mongodb/models/Task";
import AuditLogModel from "@/mongodb/models/AuditLog";
import mongoose from "mongoose";

// Utility function for network-safe requests with retry logic
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await Promise.race([
                operation(),
                new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), 15000)
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

// CRITICAL FIX: Proper monthly boundary detection using IST timezone
function getCurrentMonthBoundary() {
    // Get current time in IST (Asia/Kolkata)
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    
    // Get start of current month in IST
    const monthStart = new Date(istTime.getFullYear(), istTime.getMonth(), 1);
    
    // Get start of next month in IST
    const monthEnd = new Date(istTime.getFullYear(), istTime.getMonth() + 1, 1);
    
    return {
        monthStart,
        monthEnd,
        currentMonthKey: `${istTime.getFullYear()}-${String(istTime.getMonth() + 1).padStart(2, '0')}`
    };
}

export async function GET(req: NextRequest) {
    try {
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const Task = mongoose.models.Task || TaskModel;
        const AuditLog = mongoose.models.AuditLog || AuditLogModel;

        if (!Task || !AuditLog) {
            return NextResponse.json({ error: "Dashboard models not ready" }, { status: 500 });
        }

        // Get current month boundaries in IST
        const { monthStart, monthEnd, currentMonthKey } = getCurrentMonthBoundary();

        // CRITICAL FIX: Fetch user tasks with proper data isolation and monthly filtering
        const [allTasks, monthlyTasks, monthlyAuditLogs, recentLogs] = await Promise.all([
            // All-time tasks for user
            withRetry(() => Task.find({ userId: authUser.uid })),
            
            // Monthly tasks for user
            withRetry(() => Task.find({ 
                userId: authUser.uid,
                createdAt: { $gte: monthStart, $lt: monthEnd }
            })),
            
            // Monthly audit logs count
            withRetry(() => AuditLog.countDocuments({ 
                userId: authUser.uid,
                timestamp: { $gte: monthStart, $lt: monthEnd }
            })),
            
            // Recent activity (last 8 entries)
            withRetry(() => AuditLog.find({ userId: authUser.uid })
                .sort({ timestamp: -1 })
                .limit(8))
        ]);

        // Calculate all-time stats
        const totalTasks = allTasks.length;
        const pendingTasks = allTasks.filter((t: any) => 
            t.status === 'pending' || t.status === 'in-progress'
        ).length;
        const verifiedTasks = allTasks.filter((t: any) => 
            t.status === 'verified' || t.status === 'completed'
        ).length;

        // Calculate monthly stats
        const monthlyTasksCount = monthlyTasks.length;
        const monthlyPendingTasks = monthlyTasks.filter((t: any) => 
            t.status === 'pending' || t.status === 'in-progress'
        ).length;
        const monthlyVerifiedTasks = monthlyTasks.filter((t: any) => 
            t.status === 'verified' || t.status === 'completed'
        ).length;

        // Map logs to "Recent Activity" format
        const activity = recentLogs.map((log: any) => ({
            id: log._id,
            title: log.action.replace(/_/g, ' '),
            description: log.details,
            timestamp: log.timestamp,
            status: log.entryHash ? 'Signed' : 'Logged',
        }));

        return NextResponse.json({
            stats: {
                // All-time stats
                totalTasks,
                pendingTasks,
                verifiedTasks,
                totalEvents: await withRetry(() => AuditLog.countDocuments({ userId: authUser.uid })),
                
                // Monthly stats (CRITICAL FIX)
                monthly: {
                    monthKey: currentMonthKey,
                    tasksCreated: monthlyTasksCount,
                    tasksCompleted: monthlyVerifiedTasks,
                    tasksPending: monthlyPendingTasks,
                    securityEvents: monthlyAuditLogs,
                    monthStart: monthStart.toISOString(),
                    monthEnd: monthEnd.toISOString()
                }
            },
            activity,
            metadata: {
                timezone: 'Asia/Kolkata',
                currentTime: new Date().toISOString(),
                istTime: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
            }
        });
    } catch (error: any) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json({ 
            error: "Internal Server Error", 
            details: error.message || "Unknown error",
            retryable: true
        }, { status: 500 });
    }
}
