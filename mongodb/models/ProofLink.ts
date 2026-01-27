import mongoose, { Schema, model, models } from 'mongoose';

const ProofLinkSchema = new Schema({
    taskId: {
        type: Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
        unique: true, // One proof link per task
    },
    userId: {
        type: String,
        required: true,
    },
    visibility: {
        type: String,
        enum: ['private', 'restricted', 'public'],
        default: 'restricted', // Default to restricted (anyone with link)
    },
    allowedEmails: {
        type: [String],
        default: [],
    },
    viewCount: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const ProofLink = mongoose.models.ProofLink || mongoose.model('ProofLink', ProofLinkSchema);

export default ProofLink;
