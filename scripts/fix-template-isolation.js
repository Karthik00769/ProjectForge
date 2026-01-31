// Fix template data isolation issues
require('dotenv').config();
const mongoose = require('mongoose');

async function fixTemplateIsolation() {
  try {
    console.log('🔧 FIXING TEMPLATE DATA ISOLATION');
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

    // Find templates without proper userId
    const templatesWithoutUserId = await Template.find({ 
      userId: { $exists: false },
      isSystemTemplate: { $ne: true }
    });

    console.log(`\n⚠️ Found ${templatesWithoutUserId.length} templates without userId`);

    let fixed = 0;
    let deleted = 0;

    for (const template of templatesWithoutUserId) {
      if (template.createdBy && template.createdBy !== 'system') {
        // Assign userId from createdBy
        await Template.updateOne(
          { _id: template._id },
          { userId: template.createdBy }
        );
        console.log(`✅ Fixed "${template.title}" - assigned userId: ${template.createdBy}`);
        fixed++;
      } else {
        // Delete orphaned templates (likely duplicates from static config)
        await Template.deleteOne({ _id: template._id });
        console.log(`🗑️ Deleted orphaned template: "${template.title}"`);
        deleted++;
      }
    }

    // Also fix templates with undefined userId
    const templatesWithUndefinedUserId = await Template.find({ 
      userId: undefined,
      isSystemTemplate: { $ne: true }
    });

    console.log(`\n⚠️ Found ${templatesWithUndefinedUserId.length} templates with undefined userId`);

    for (const template of templatesWithUndefinedUserId) {
      if (template.createdBy && template.createdBy !== 'system') {
        // Assign userId from createdBy
        await Template.updateOne(
          { _id: template._id },
          { userId: template.createdBy }
        );
        console.log(`✅ Fixed "${template.title}" - assigned userId: ${template.createdBy}`);
        fixed++;
      } else {
        // Delete orphaned templates
        await Template.deleteOne({ _id: template._id });
        console.log(`🗑️ Deleted orphaned template: "${template.title}"`);
        deleted++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Fixed: ${fixed} templates`);
    console.log(`   🗑️ Deleted: ${deleted} orphaned templates`);

    // Final verification
    const remainingBadTemplates = await Template.countDocuments({
      $or: [
        { userId: { $exists: false } },
        { userId: undefined }
      ],
      isSystemTemplate: { $ne: true }
    });

    if (remainingBadTemplates === 0) {
      console.log('\n🎉 ALL TEMPLATE ISOLATION ISSUES FIXED!');
    } else {
      console.log(`\n⚠️ ${remainingBadTemplates} templates still need attention`);
    }

  } catch (error) {
    console.error('❌ Error fixing templates:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixTemplateIsolation();