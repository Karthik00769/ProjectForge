import connectDB from "../mongodb/db";
import TemplateModel from "../mongodb/models/Template";

async function debugTemplateFlow() {
    try {
        await connectDB();
        
        console.log("🔍 DEBUGGING TEMPLATE FLOW");
        console.log("=" .repeat(50));
        
        // 1. List all templates with their IDs
        console.log("\n1️⃣ ALL TEMPLATES IN DATABASE:");
        const allTemplates = await TemplateModel.find({}).sort({ createdAt: -1 });
        
        console.log(`📊 Total templates: ${allTemplates.length}`);
        
        allTemplates.forEach((template, index) => {
            console.log(`\n${index + 1}. ${template.title || template.name}`);
            console.log(`   🆔 ID: ${template._id}`);
            console.log(`   👤 User ID: ${template.userId}`);
            console.log(`   🏷️ Category: ${template.category}`);
            console.log(`   🔧 System Template: ${template.isSystemTemplate ? 'Yes' : 'No'}`);
            console.log(`   📅 Created: ${template.createdAt}`);
            console.log(`   📝 Steps: ${template.steps?.length || 0}`);
        });
        
        // 2. Test template lookup by ID
        console.log("\n2️⃣ TESTING TEMPLATE LOOKUP:");
        
        if (allTemplates.length > 0) {
            const testTemplate = allTemplates[0];
            console.log(`\n🧪 Testing lookup for template: ${testTemplate.title}`);
            console.log(`   🆔 Looking up ID: ${testTemplate._id}`);
            
            // Test direct lookup
            const foundTemplate = await TemplateModel.findById(testTemplate._id);
            if (foundTemplate) {
                console.log(`   ✅ Direct lookup successful: ${foundTemplate.title}`);
            } else {
                console.log(`   ❌ Direct lookup failed`);
            }
            
            // Test user-filtered lookup (simulating API behavior)
            const userFilteredTemplate = await TemplateModel.findOne({
                _id: testTemplate._id,
                $or: [
                    { userId: testTemplate.userId },
                    { isSystemTemplate: true }
                ]
            });
            
            if (userFilteredTemplate) {
                console.log(`   ✅ User-filtered lookup successful: ${userFilteredTemplate.title}`);
            } else {
                console.log(`   ❌ User-filtered lookup failed`);
            }
        }
        
        // 3. Check for ID format issues
        console.log("\n3️⃣ CHECKING ID FORMATS:");
        
        allTemplates.forEach((template, index) => {
            const id = template._id.toString();
            const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
            console.log(`   ${index + 1}. ${template.title}: ${id} (${isValidObjectId ? 'Valid' : 'Invalid'} ObjectId)`);
        });
        
        // 4. Test API endpoint simulation
        console.log("\n4️⃣ SIMULATING API ENDPOINT BEHAVIOR:");
        
        if (allTemplates.length > 0) {
            const testTemplate = allTemplates[0];
            const templateId = testTemplate._id.toString();
            
            console.log(`\n🌐 Simulating GET /api/templates/${templateId}`);
            
            try {
                // Simulate the exact query from the API
                const apiResult = await TemplateModel.findOne({
                    _id: templateId,
                    $or: [
                        { userId: testTemplate.userId },
                        { isSystemTemplate: true }
                    ]
                });
                
                if (apiResult) {
                    console.log(`   ✅ API simulation successful`);
                    console.log(`   📋 Template: ${apiResult.title}`);
                    console.log(`   🆔 ID: ${apiResult._id}`);
                    console.log(`   👤 User: ${apiResult.userId}`);
                } else {
                    console.log(`   ❌ API simulation failed - template not found`);
                }
            } catch (error) {
                console.log(`   ❌ API simulation error:`, error);
            }
        }
        
        // 5. Check for common issues
        console.log("\n5️⃣ CHECKING FOR COMMON ISSUES:");
        
        const issuesFound = [];
        
        // Check for templates without userId
        const templatesWithoutUserId = await TemplateModel.countDocuments({ 
            userId: { $exists: false },
            isSystemTemplate: { $ne: true }
        });
        if (templatesWithoutUserId > 0) {
            issuesFound.push(`${templatesWithoutUserId} templates without userId`);
        }
        
        // Check for duplicate template names
        const duplicateNames = await TemplateModel.aggregate([
            { $group: { _id: "$title", count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]);
        if (duplicateNames.length > 0) {
            issuesFound.push(`${duplicateNames.length} duplicate template names`);
        }
        
        // Check for templates with empty steps
        const templatesWithoutSteps = await TemplateModel.countDocuments({
            $or: [
                { steps: { $exists: false } },
                { steps: { $size: 0 } }
            ]
        });
        if (templatesWithoutSteps > 0) {
            issuesFound.push(`${templatesWithoutSteps} templates without steps`);
        }
        
        if (issuesFound.length === 0) {
            console.log("   ✅ No issues found - templates are healthy!");
        } else {
            console.log("   ⚠️ Issues found:");
            issuesFound.forEach(issue => console.log(`      - ${issue}`));
        }
        
        console.log("\n🎯 DEBUGGING COMPLETE");
        console.log("=" .repeat(50));
        
    } catch (error) {
        console.error("❌ Error during template debugging:", error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Run the debugging script
debugTemplateFlow();