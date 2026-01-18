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
    fileHash: {
        type: String, // SHA-256 hash for integrity
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Proof = models.Proof || model('Proof', ProofSchema);

export default Proof;
