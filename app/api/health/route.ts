import { NextRequest, NextResponse } from "next/server";

// Simple health check endpoint for connection monitoring
export async function GET(req: NextRequest) {
    return NextResponse.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString() 
    });
}

export async function HEAD(req: NextRequest) {
    return new NextResponse(null, { status: 200 });
}