import connectDB from "../mongodb/db";
import TemplateModel from "../mongodb/models/Template";
import TaskModel from "../mongodb/models/Task";
import AuditLogModel from "../mongodb/models/AuditLog";
import ProofModel from "../mongodb/models/Proof";

async function verifyDataIsolation() {
  try {
    await connectDB();
    
    console.log("🔍 Verifying data isolation across all collections...");
    
    // Check Templates
    const templatesWithoutUserId = await TemplateModel.countDocuments({ 
      userId: { $exists: false },
      isSystemTemplate: { $ne: true }
    });
    
    const systemTemplates = await TemplateModel.countDocuments({ isSystemTemplate: true });
    const userTemplates = await TemplateModel.countDocuments({ 
      userId: { $exists: true, $ne: 'system' },
      isSystemTemplate: { $ne: true }
    });
    
    console.log("📋 TEMPLATES:");
    console.log(`  ✅ System templates: ${systemTemplates}`);
    console.log(`  ✅ User templates: ${userTemplates}`);
    console.log(`  ${templatesWithoutUserId === 0 ? '✅' : '❌'} Templates without userId: ${templatesWithoutUserId}`);
    
    // Check Tasks
    const tasksWithoutUserId = await TaskModel.countDocuments({ userId: { $exists: false } });
    const totalTasks = await TaskModel.countDocuments({});
    
    console.log("📝 TASKS:");
    console.log(`  ✅ Total tasks: ${totalTasks}`);
    console.log(`  ${tasksWithoutUserId === 0 ? '✅' : '❌'} Tasks without userId: ${tasksWithoutUserId}`);
    
    // Check Audit Logs
    const auditLogsWithoutUserId = await AuditLogModel.countDocuments({ userId: { $exists: false } });
    const totalAuditLogs = await AuditLogModel.countDocuments({});
    
    console.log("📊 AUDIT LOGS:");
    console.log(`  ✅ Total audit logs: ${totalAuditLogs}`);
    console.log(`  ${auditLogsWithoutUserId === 0 ? '✅' : '❌'} Audit logs without userId: ${auditLogsWithoutUserId}`);
    
    // Check Proofs
    const proofsWithoutUserId = await ProofModel.countDocuments({ userId: { $exists: false } });
    const totalProofs = await ProofModel.countDocuments({});
    
    console.log("📎 PROOFS:");
    console.log(`  ✅ Total proofs: ${totalProofs}`);
    console.log(`  ${proofsWithoutUserId === 0 ? '✅' : '❌'} Proofs without userId: ${proofsWithoutUserId}`);
    
    // Summary
    const hasIssues = templatesWithoutUserId > 0 || tasksWithoutUserId > 0 || 
                     auditLogsWithoutUserId > 0 || proofsWithoutUserId > 0;
    
    console.log("\n🎯 DATA ISOLATION SUMMARY:");
    if (hasIssues) {
      console.log("❌ CRITICAL: Data isolation issues found!");
      console.log("   Please run data migration scripts to fix these issues.");
    } else {
      console.log("✅ SUCCESS: All data properly isolated by userId!");
      console.log("   System is secure and ready for production.");
    }
    
    // Check indexes
    console.log("\n📈 CHECKING INDEXES:");
    const collections = [
      { name: 'templates', model: TemplateModel },
      { name: 'tasks', model: TaskModel },
      { name: 'auditlogs', model: AuditLogModel },
      { name: 'proofs', model: ProofModel }
    ];
    
    for (const collection of collections) {
      const indexes = await collection.model.collection.getIndexes();
      const hasUserIdIndex = Object.keys(indexes).some(key => 
        key.includes('userId') || indexes[key].some((field: any) => field[0] === 'userId')
      );
      console.log(`  ${hasUserIdIndex ? '✅' : '⚠️'} ${collection.name}: userId index ${hasUserIdIndex ? 'exists' : 'missing'}`);
    }
    
  } catch (error) {
    console.error("❌ Error verifying data isolation:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the verification script
verifyDataIsolation();