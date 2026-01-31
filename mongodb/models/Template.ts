import mongoose, { Schema, model, models } from 'mongoose';

const TemplateSchema = new Schema({
    userId: {
        type: String, // Firebase UID - REQUIRED for data isolation
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    category: {
        type: String, // e.g., 'professional-services', 'skilled-worker'
        required: true,
    },
    steps: [{
        id: String,
        name: String,
        description: String,
        required: Boolean,
        proofType: { type: String, enum: ['photo', 'pdf', 'both'], required: false },
        icon: { type: String, required: false }, // Optional icon for the step
    }],
    createdBy: {
        type: String, // 'system' or userId - DEPRECATED, use userId instead
        required: true,
        default: 'system'
    },
    isSystemTemplate: {
        type: Boolean,
        default: false, // true for built-in templates, false for user-created
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Template = mongoose.models.Template || mongoose.model('Template', TemplateSchema);

export default Template;
