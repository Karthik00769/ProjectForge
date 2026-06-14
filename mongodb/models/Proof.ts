import mongoose, { Schema, model, models } from 'mongoose';

const ProofSchema = new Schema({
    userId: {
        type: String, // Firebase UID
        required: true,
    },
    taskId: {
        type: Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
    },
    stepId: {
        type: String,
        required: true,
    },
    fileUrl: {
        type: String, // URL to Firebase Storage or other storage
        required: true,
    },
    fileName: {
        type: String,
    },
    fileType: {
        type: String,
    },
    fileData: {
        type: Buffer, // Store file content directly (limit < 16MB)
        select: false, // Don't return by default for performance
    },
    fileHash: {
        type: String, // SHA-256 hash for integrity
        required: true,
    },
    aiVerification: {
        status: { type: String, enum: ['pending','completed','analysis_failed'], default: undefined },
        confidence: { type: Number },
        matchedSteps: { type: [String], default: [] },
        missingSteps: { type: [String], default: [] },
        summary: { type: String },
        recommendation: { type: String },
        model: { type: String },
        analyzedAt: { type: Date }
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Proof = mongoose.models.Proof || mongoose.model('Proof', ProofSchema);

export default Proof;
