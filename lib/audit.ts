import AuditLog from "@/mongodb/models/AuditLog";
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
    // 1. Get the last entry's hash to chain them
    const lastEntry = await AuditLog.findOne({}).sort({ timestamp: -1 });
    const previousHash = lastEntry ? lastEntry.entryHash : "0".repeat(64);

    // 2. Prepare content for hashing
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

    // 3. Generate entry hash
    const entryHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(entryData))
        .digest("hex");

    // 4. Create the entry
    return await AuditLog.create({
        ...data,
        entryHash,
        previousHash,
        integrityStatus: data.integrityStatus || 'valid',
        timestamp: entryData.timestamp
    });
}
