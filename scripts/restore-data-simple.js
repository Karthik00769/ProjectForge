// Simple JavaScript version for immediate deployment
require('dotenv').config();
const mongoose = require('mongoose');

// Template data (essential system templates)
const SYSTEM_TEMPLATES = [
  {
    userId: 'system',
    title: 'Electrician Job',
    description: 'Verify electrical installation, repairs, and safety checks',
    category: 'Skilled & Field Work',
    steps: [
      { id: 'step-1', name: 'Job Assigned', description: 'Confirm job assignment and initial briefing', required: true, proofType: 'photo' },
      { id: 'step-2', name: 'Before-Work Photo', description: 'Upload photo of the work area before starting', required: true, proofType: 'photo' },
      { id: 'step-3', name: 'Work In Progress', description: 'Document work being performed with photo/video', required: true, proofType: 'photo' },
      { id: 'step-4', name: 'Work Completed Photo', description: 'Upload final photo of completed work', required: true, proofType: 'photo' },
      { id: 'step-5', name: 'Client Confirmation', description: 'Get client sign-off and approval', required: true, proofType: 'photo' }
    ],
    createdBy: 'system',
    isSystemTemplate: true,
    createdAt: new Date()
  },
  {
    userId: 'system',
    title: 'Plumber Job',
    description: 'Document pipe installation and repair work',
    category: 'Skilled & Field Work',
    steps: [
      { id: 'step-1', name: 'Site Inspection', description: 'Document existing conditions with photos', required: true, proofType: 'photo' },
      { id: 'step-2', name: 'Work in Progress', description: 'Capture installation/repair work', required: true, proofType: 'photo' },
      { id: 'step-3', name: 'Final Installation', description: 'Photo of completed plumbing work', required: true, proofType: 'photo' },
      { id: 'step-4', name: 'Client Approval', description: 'Get client sign-off', required: true, proofType: 'photo' }
    ],
    createdBy: 'system',
    isSystemTemplate: true,
    createdAt: new Date()
  },
  {
    userId: 'system',
    title: 'Website Development Project',
    description: 'Track web development project milestones',
    category: 'Freelancers & Creators',
    steps: [
      { id: 'step-1', name: 'Project Setup', description: 'Initial project setup and repository', required: true, proofType: 'both' },
      { id: 'step-2', name: 'Design Mockups', description: 'Share design mockups with client', required: true, proofType: 'pdf' },
      { id: 'step-3', name: 'Development Work', description: 'Code repository and progress updates', required: true, proofType: 'both' },
      { id: 'step-4', name: 'Testing & QA', description: 'Testing documentation and results', required: true, proofType: 'both' },
      { id: 'step-5', name: 'Deployment & Launch', description: 'Site deployment and launch proof', required: true, proofType: 'photo' }
    ],
    createdBy: 'system',
    isSystemTemplate: true,
    createdAt: new Date()
  },
  {
    userId: 'system',
    title: 'Client Deliverable Workflow',
    description: 'Verify client project completion with evidence',
    category: 'Business & Client Delivery',
    steps: [
      { id: 'step-1', name: 'Requirement Confirmation', description: 'Confirm all client requirements are understood', required: true, proofType: 'both' },
      { id: 'step-2', name: 'Work Execution', description: 'Complete the deliverable work', required: true, proofType: 'photo' },
      { id: 'step-3', name: 'Internal Review', description: 'Internal quality assurance and review', required: true, proofType: 'pdf' },
      { id: 'step-4', name: 'Client Delivery', description: 'Deliver final deliverable to client', required: true, proofType: 'both' },
      { id: 'step-5', name: 'Client Acknowledgment', description: 'Receive client sign-off and approval', required: true, proofType: 'both' }
    ],
    createdBy: 'system',
    isSystemTemplate: true,
    createdAt: new Date()
  },
  {
    userId: 'system',
    title: 'Daily Work Log',
    description: 'Simple daily task and activity logging',
    category: 'General Purpose',
    steps: [
      { id: 'step-1', name: 'Daily Activities', description: 'Document daily activities', required: true, proofType: 'both' },
      { id: 'step-2', name: 'Completion', description: 'Daily summary and completion', required: true, proofType: 'pdf' }
    ],
    createdBy: 'system',
    isSystemTemplate: true,
    createdAt: new Date()
  }
];

async function restoreData() {
  try {
    console.log('🔧 PROJECTFORGE SIMPLE DATA RESTORATION');
    console.log('🌍 RUNNING ON PRODUCTION ENVIRONMENT');
    console.log('=' .repeat(60));

    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connection established');

    // Get Template model
    const TemplateSchema = new mongoose.Schema({
      userId: { type: String, required: true, index: true },
      title: { type: String, required: true },
      description: String,
      category: { type: String, required: true },
      steps: [{
        id: String,
        name: String,
        description: String,
        required: Boolean,
        proofType: { type: String, enum: ['photo', 'pdf', 'both'] },
        icon: String
      }],
      createdBy: { type: String, required: true, default: 'system' },
      isSystemTemplate: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    });

    const Template = mongoose.models.Template || mongoose.model('Template', TemplateSchema);

    // Check existing system templates
    const existingCount = await Template.countDocuments({ isSystemTemplate: true });
    console.log(`📋 Found ${existingCount} existing system templates`);

    if (existingCount === 0) {
      console.log('🔄 Installing system templates...');
      
      // Insert system templates
      const result = await Template.insertMany(SYSTEM_TEMPLATES);
      console.log(`✅ Installed ${result.length} system templates`);
    } else {
      console.log('✅ System templates already exist');
    }

    // Create indexes
    try {
      await Template.collection.createIndex({ userId: 1 });
      await Template.collection.createIndex({ isSystemTemplate: 1 });
      console.log('✅ Indexes created successfully');
    } catch (error) {
      console.log('⚠️ Some indexes may already exist (this is normal)');
    }

    console.log('\n🎉 SIMPLE DATA RESTORATION COMPLETED!');
    console.log('✅ System ready for production');

  } catch (error) {
    console.error('❌ Error during restoration:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the script
restoreData();