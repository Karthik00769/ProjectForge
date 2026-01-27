import mongoose, { Schema, model, models } from 'mongoose';

const TaskSchema = new Schema({
    userId: {
        type: String, // Firebase UID
        required: true,
        index: true,
    },
    templateId: {
        type: Schema.Types.ObjectId,
        ref: 'Template',
        required: false,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'verified'],
        default: 'pending',
    },
    completionDate: {
        type: Date,
    },
    dueDate: {
        type: Date,
    },
    steps: [{
        stepId: String, // Matches ID in Template steps
        status: {
            type: String,
            enum: ['pending', 'completed'],
            default: 'pending',
        },
        proofId: {
            type: Schema.Types.ObjectId,
            ref: 'Proof',
        },
        uploadedAt: Date,
        fileHash: String, // Store hash for tamper detection
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

export default Task;
