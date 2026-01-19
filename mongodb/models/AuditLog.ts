import mongoose, { Schema, model, models } from 'mongoose';

// Immutable log of actions
const AuditLogSchema = new Schema({
    userId: {
        type: String, // Firebase UID
        required: true,
        index: true,
    },
    taskId: {
        type: Schema.Types.ObjectId,
        ref: 'Task',
        index: true,
    },
    action: {
        type: String, // e.g., 'TASK_CREATED', 'PROOF_UPLOADED', 'TASK_COMPLETED'
        required: true,
    },
    details: {
        type: String, // Readable description
    },
    metadata: {
        type: Map,
        of: Schema.Types.Mixed, // Flexible metadata like { fileHash, stepId, ipAddress }
    },
    entityType: {
        type: String, // e.g., 'TASK', 'USER', 'PROOF'
    },
    entityId: {
        type: String, // ID of the referenced entity
    },
    ipHash: {
        type: String, // Hashed IP for privacy
    },
    deviceFingerprintHash: {
        type: String, // Hashed fingerprint
    },
    entryHash: {
        type: String, // Hash of this entry
        unique: true,
    },
    previousHash: {
        type: String, // Hash of the preceding entry
    },
    integrityStatus: {
        type: String, // 'valid', 'flagged'
        default: 'valid',
    },
    timestamp: {
        type: Date,
        default: Date.now,
        immutable: true, // Cannot be changed once written
        index: true,
    },
});

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

export default AuditLog;
