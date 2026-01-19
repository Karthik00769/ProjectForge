import mongoose from "mongoose";
import AuditLogModel from "@/mongodb/models/AuditLog";
import crypto from "crypto";

export async function createAuditEntry(data: {
    userId: string;
    action: string;
    details?: string;
    taskId?: string;
    metadata?: any;
    integrityStatus?: string;
    entityType?: string;
    entityId?: string;
    ipHash?: string;
    deviceFingerprintHash?: string;
}) {
    // 1. Ensure model is available
    const AuditLog = mongoose.models.AuditLog || AuditLogModel;
    if (!AuditLog) {
        console.error("CRITICAL: AuditLog model is undefined in createAuditEntry");
        throw new Error("Internal Server Error: Database model not initialized");
    }

    // 2. Get the last entry's hash to chain them
    const lastEntry = await AuditLog.findOne({}).sort({ timestamp: -1 });
    const previousHash = lastEntry ? lastEntry.entryHash : "0".repeat(64);

    // 3. Prepare content for hashing
    const entryData = {
        userId: data.userId,
        action: data.action,
        details: data.details || "",
        taskId: data.taskId || "",
        entityType: data.entityType || "",
        entityId: data.entityId || "",
        metadata: JSON.stringify(data.metadata || {}),
        previousHash,
        timestamp: new Date().toISOString()
    };

    // 4. Generate entry hash
    const entryHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(entryData))
        .digest("hex");

    // 5. Create the entry
    return await AuditLog.create({
        ...data,
        entryHash,
        previousHash,
        integrityStatus: data.integrityStatus || 'valid',
        timestamp: entryData.timestamp
    });
}
