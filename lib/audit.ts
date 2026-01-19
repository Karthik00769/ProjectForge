import mongoose from "mongoose";
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
    // NUCLEAR OPTION: Define AuditLog model inline if it doesn't exist
    let AuditLog;
    if (mongoose.models.AuditLog) {
        AuditLog = mongoose.models.AuditLog;
    } else {
        const AuditLogSchema = new mongoose.Schema({
            userId: { type: String, required: true, index: true },
            taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', index: true },
            action: { type: String, required: true },
            details: { type: String },
            metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
            entityType: { type: String },
            entityId: { type: String },
            ipHash: { type: String },
            deviceFingerprintHash: { type: String },
            entryHash: { type: String, unique: true },
            previousHash: { type: String },
            integrityStatus: { type: String, default: 'valid' },
            timestamp: { type: Date, default: Date.now, immutable: true, index: true },
        });
        AuditLog = mongoose.model('AuditLog', AuditLogSchema);
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
