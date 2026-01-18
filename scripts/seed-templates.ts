import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI not found in .env");
    process.exit(1);
}

// We can't easily use the mongoose models directly with ts-node if they rely on "next-edge" or other next specific things,
// but our models are plain mongoose. 
// However, initializing mongoose connection manually here is safer for a script.

import mongoose from 'mongoose';

const TemplateSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    steps: [{
        id: String,
        name: String,
        description: String,
        required: Boolean,
        proofType: String
    }],
    createdBy: { type: String, required: true, default: 'system' },
    createdAt: { type: Date, default: Date.now },
});

const Template = mongoose.models.Template || mongoose.model('Template', TemplateSchema);

const templatesToSeed = [
    {
        title: "Electrical Safety Check",
        description: "Standard safety inspection for residential electrical systems.",
        category: "Skilled Trades",
        steps: [
            { id: "s1", name: "Main Panel Inspection", description: "Check main breaker and busbar connections.", required: true, proofType: "photo" },
            { id: "s2", name: "Grounding Verification", description: "Verify proper grounding of the system.", required: true, proofType: "photo" },
            { id: "s3", name: "Outlet Testing", description: "Test random sample of outlets for polarity and ground.", required: true, proofType: "both" }, // Photo result or pdf report
            { id: "s4", name: "Final Sign-off", description: "Customer signature on work order.", required: true, proofType: "pdf" }
        ],
        createdBy: "system"
    },
    {
        title: "Freelance Web Development",
        description: "Milestone tracking for website delivery.",
        category: "Freelancer",
        steps: [
            { id: "s1", name: "Design Mockups", description: "Upload approved Figma/Adobe XD designs.", required: true, proofType: "pdf" },
            { id: "s2", name: "Frontend Development", description: "Link to deployed staging site or screenshot.", required: true, proofType: "both" },
            { id: "s3", name: "Backend Integration", description: "Evidence of API connectivity.", required: true, proofType: "photo" },
            { id: "s4", name: "UAT Sign-off", description: "User Acceptance Testing approval email/doc.", required: true, proofType: "pdf" }
        ],
        createdBy: "system"
    },
    {
        title: "Business Audit Preparation",
        description: "Preparing documents for quarterly financial audit.",
        category: "Business",
        steps: [
            { id: "s1", name: "Bank Statements", description: "Upload last 3 months of bank statements.", required: true, proofType: "pdf" },
            { id: "s2", name: "Expense Reports", description: "Consolidated expense report.", required: true, proofType: "pdf" },
            { id: "s3", name: "Revenue Reconciliation", description: "Revenue vs Bank Deposit match sheet.", required: true, proofType: "pdf" },
            { id: "s4", name: "Manager Approval", description: "Signed approval from department head.", required: true, proofType: "pdf" }
        ],
        createdBy: "system"
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI as string);
        console.log("Connected to MongoDB");

        // Clear existing system templates to avoid duplicates (optional, but good for idempotent seeding)
        // Or upsert. Let's just delete 'system' created ones and recreate.
        const deleteResult = await Template.deleteMany({ createdBy: 'system' });
        console.log(`Deleted ${deleteResult.deletedCount} existing system templates.`);

        const insertResult = await Template.insertMany(templatesToSeed);
        console.log(`Successfully seeded ${insertResult.length} templates.`);

        await mongoose.disconnect();
        console.log("Disconnected.");
    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
}

seed();
