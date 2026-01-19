import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
        category: "Skilled & Field Work",
        steps: [
            { id: "s1", name: "Main Panel Inspection", description: "Check main breaker and busbar connections.", required: true, proofType: "photo" },
            { id: "s2", name: "Grounding Verification", description: "Verify proper grounding of the system.", required: true, proofType: "photo" },
            { id: "s3", name: "Outlet Testing", description: "Test random sample of outlets for polarity and ground.", required: true, proofType: "both" },
            { id: "s4", name: "Final Sign-off", description: "Customer signature on work order.", required: true, proofType: "pdf" }
        ],
        createdBy: "system"
    },
    {
        title: "Construction Milestone: Foundation",
        description: "Verification of foundation laying and curing.",
        category: "Construction & Infrastructure",
        steps: [
            { id: "s1", name: "Excavation Depth Check", description: "Verify trench depth according to blueprints.", required: true, proofType: "photo" },
            { id: "s2", name: "Rebar Placement", description: "Document steel reinforcement layout.", required: true, proofType: "photo" },
            { id: "s3", name: "Concrete Pouring", description: "Action shots of concrete pouring.", required: true, proofType: "photo" },
            { id: "s4", name: "Curing Log", description: "Temperatue and moisture log over 7 days.", required: true, proofType: "pdf" }
        ],
        createdBy: "system"
    },
    {
        title: "Courier Delivery Proof",
        description: "Secured high-value delivery verification.",
        category: "Business & Client Delivery",
        steps: [
            { id: "s1", name: "Pickup Confirmation", description: "Photo of package at pickup point.", required: true, proofType: "photo" },
            { id: "s2", name: "Transit Hub Check-in", description: "Entry into secure transit facility.", required: false, proofType: "photo" },
            { id: "s3", name: "Recipient ID Verification", description: "Redacted photo of recipient ID.", required: true, proofType: "photo" },
            { id: "s4", name: "Proof of Delivery", description: "Signed delivery note and package at door.", required: true, proofType: "both" }
        ],
        createdBy: "system"
    },
    {
        title: "Sales Territory Report",
        description: "Weekly sales activity and client visit evidence.",
        category: "Sales / Operations / Office Work",
        steps: [
            { id: "s1", name: "Client Visit 1", description: "Meeting notes and card exchange photo.", required: true, proofType: "both" },
            { id: "s2", name: "Proposal Submission", description: "PDF copy of sent proposal.", required: true, proofType: "pdf" },
            { id: "s3", name: "CRM Update", description: "Screenshot of updated CRM records.", required: true, proofType: "photo" }
        ],
        createdBy: "system"
    },
    {
        title: "Marketing Campaign Launch",
        description: "Proof of asset deployment across channels.",
        category: "Sales / Operations / Office Work",
        steps: [
            { id: "s1", name: "Social Media Post Live", description: "Screenshots of scheduled/live posts.", required: true, proofType: "photo" },
            { id: "s2", name: "Email Blast Confirmation", description: "Analytics report from email provider.", required: true, proofType: "pdf" },
            { id: "s3", name: "Ad Spend Verification", description: "Billing statement from ad platform.", required: true, proofType: "pdf" }
        ],
        createdBy: "system"
    },
    {
        title: "IT Deployment Log",
        description: "Verification of server or software rollout.",
        category: "Freelancers & Creators",
        steps: [
            { id: "s1", name: "UAT Sign-off", description: "Customer acceptance in staging environment.", required: true, proofType: "pdf" },
            { id: "s2", name: "Production Migration", description: "Log files of successful deployment.", required: true, proofType: "pdf" },
            { id: "s3", name: "Post-Launch Health Check", description: "Monitoring dashboard screenshot.", required: true, proofType: "photo" }
        ],
        createdBy: "system"
    }
];

async function seed() {
    console.log("Starting seeding process...");
    try {
        if (!MONGODB_URI) throw new Error("MONGODB_URI is not defined");
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("Connected successfully.");

        // Clear existing system templates to avoid duplicates (idempotent seeding)
        const deleteResult = await Template.deleteMany({ createdBy: 'system' });
        console.log(`Deleted ${deleteResult.deletedCount} existing system templates.`);

        const insertResult = await Template.insertMany(templatesToSeed);
        console.log(`Successfully seeded ${insertResult.length} templates.`);

        await mongoose.disconnect();
        console.log("Disconnected.");
    } catch (error: any) {
        console.error("Seeding error details:");
        console.error("Name:", error.name);
        console.error("Message:", error.message);
        if (error.message.includes("whitelist")) {
            console.error("CRITICAL: Your IP is likely not whitelisted in MongoDB Atlas.");
        }
        process.exit(1);
    }
}

seed().then(() => {
    console.log("Seed script finished.");
    process.exit(0);
}).catch(err => {
    console.error("Unhandled error:", err);
    process.exit(1);
});
