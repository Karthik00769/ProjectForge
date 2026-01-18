import mongoose, { Schema, model, models } from 'mongoose';

const TemplateSchema = new Schema({
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
        type: String, // 'system' or userId
        required: true,
        default: 'system'
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Template = models.Template || model('Template', TemplateSchema);

export default Template;
