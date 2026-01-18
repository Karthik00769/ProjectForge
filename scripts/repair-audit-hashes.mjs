import mongoose from 'mongoose';
import AuditLog from './mongodb/models/AuditLog.js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function repairAuditLogs() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const logs = await AuditLog.find({}).sort({ timestamp: 1 });
        console.log(`Found ${logs.length} logs to process.`);

        let previousHash = "0".repeat(64);

        for (const log of logs) {
            // Generate entry hash if missing
            if (!log.entryHash) {
                const entryData = {
                    userId: log.userId,
                    action: log.action,
                    details: log.details || "",
                    taskId: log.taskId ? log.taskId.toString() : "",
                    metadata: JSON.stringify(log.metadata || {}),
                    previousHash: previousHash,
                    timestamp: log.timestamp.toISOString()
                };

                const entryHash = crypto
                    .createHash("sha256")
                    .update(JSON.stringify(entryData))
                    .digest("hex");

                log.entryHash = entryHash;
                log.previousHash = previousHash;
                log.integrityStatus = log.integrityStatus || 'valid';

                await log.save();
                console.log(`Updated log ${log._id} with hash: ${entryHash.slice(0, 8)}...`);
            }
            previousHash = log.entryHash;
        }

        console.log('Audit log repair complete.');
        process.exit(0);
    } catch (error) {
        console.error('Repair failed:', error);
        process.exit(1);
    }
}

repairAuditLogs();
