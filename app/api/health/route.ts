import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";

// Enhanced health check endpoint for comprehensive system monitoring
export async function GET(req: NextRequest) {
    const startTime = Date.now();
    const checks: Record<string, any> = {};

    try {
        // Database connectivity check
        try {
            await connectDB();
            checks.database = { status: 'healthy', responseTime: Date.now() - startTime };
        } catch (error) {
            checks.database = { status: 'unhealthy', error: 'Database connection failed' };
        }

        // Memory usage check
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const memory = process.memoryUsage();
            checks.memory = {
                status: memory.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', // 500MB threshold
                heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
            };
        }

        // Environment check
        checks.environment = {
            status: 'healthy',
            nodeEnv: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
        };

        const overallStatus = Object.values(checks).every(check => 
            check.status === 'healthy' || check.status === 'warning'
        ) ? 'healthy' : 'unhealthy';

        const responseTime = Date.now() - startTime;

        return NextResponse.json({
            status: overallStatus,
            timestamp: new Date().toISOString(),
            responseTime: `${responseTime}ms`,
            checks,
            version: '1.0.0'
        }, {
            status: overallStatus === 'healthy' ? 200 : 503,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-Response-Time': `${responseTime}ms`,
            }
        });

    } catch (error) {
        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
            responseTime: `${Date.now() - startTime}ms`
        }, { status: 503 });
    }
}

export async function HEAD(req: NextRequest) {
    const startTime = Date.now();
    
    try {
        // Quick database ping for HEAD requests
        await connectDB();
        
        return new NextResponse(null, { 
            status: 200,
            headers: {
                'X-Response-Time': `${Date.now() - startTime}ms`,
                'Cache-Control': 'no-cache',
            }
        });
    } catch (error) {
        return new NextResponse(null, { 
            status: 503,
            headers: {
                'X-Response-Time': `${Date.now() - startTime}ms`,
            }
        });
    }
}