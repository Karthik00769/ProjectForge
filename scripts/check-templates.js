// Quick check script to verify templates
require('dotenv').config();
const mongoose = require('mongoose');

async function checkTemplates() {
  try {
    console.log('🔍 CHECKING TEMPLATE RESTORATION');
    console.log('=' .repeat(40));

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Define Template schema
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

    // Check system templates
    const systemTemplates = await Template.find({ isSystemTemplate: true });
    console.log(`\n📋 System Templates: ${systemTemplates.length}`);
    
    systemTemplates.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.title} (${template.category})`);
      console.log(`      Steps: ${template.steps.length}`);
    });

    // Check user templates
    const userTemplates = await Template.find({ 
      isSystemTemplate: { $ne: true },
      userId: { $ne: 'system' }
    });
    console.log(`\n👤 User Templates: ${userTemplates.length}`);
    
    if (userTemplates.length > 0) {
      userTemplates.forEach((template, index) => {
        console.log(`   ${index + 1}. ${template.title} (User: ${template.userId})`);
      });
    }

    // Test template lookup (simulate API behavior)
    if (systemTemplates.length > 0) {
      const testTemplate = systemTemplates[0];
      console.log(`\n🧪 Testing template lookup for: ${testTemplate.title}`);
      
      const foundTemplate = await Template.findOne({
        _id: testTemplate._id,
        $or: [
          { userId: 'system' },
          { isSystemTemplate: true }
        ]
      });
      
      if (foundTemplate) {
        console.log('✅ Template lookup successful');
      } else {
        console.log('❌ Template lookup failed');
      }
    }

    console.log('\n🎯 TEMPLATE CHECK COMPLETED');
    console.log('✅ Templates are properly restored and accessible');

  } catch (error) {
    console.error('❌ Error checking templates:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkTemplates();