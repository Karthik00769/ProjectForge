import connectDB from "../mongodb/db";
import TemplateModel from "../mongodb/models/Template";
import { TEMPLATES } from "../app/dashboard/templates/template-config";

async function seedSystemTemplates() {
  try {
    await connectDB();
    
    console.log("🌱 Seeding system templates...");
    
    // Clear existing system templates
    await TemplateModel.deleteMany({ isSystemTemplate: true });
    console.log("✅ Cleared existing system templates");
    
    // Convert frontend templates to MongoDB format
    const systemTemplates = TEMPLATES.map(template => ({
      userId: 'system', // System user ID
      title: template.name,
      description: template.description,
      category: template.category,
      steps: template.steps.map(step => ({
        id: step.id,
        name: step.name,
        description: step.description,
        required: step.isRequired,
        proofType: step.proofType || 'both',
        icon: step.icon
      })),
      createdBy: 'system', // Backward compatibility
      isSystemTemplate: true, // Mark as system template
      createdAt: new Date()
    }));
    
    // Insert system templates
    const result = await TemplateModel.insertMany(systemTemplates);
    console.log(`✅ Seeded ${result.length} system templates`);
    
    // Verify seeding
    const count = await TemplateModel.countDocuments({ isSystemTemplate: true });
    console.log(`📊 Total system templates in database: ${count}`);
    
    console.log("🎉 System template seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding system templates:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the seeding script
seedSystemTemplates();