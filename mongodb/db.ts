import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongooseCache: MongooseCache;
}

let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

async function connectDB() {
    if (!MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable inside .env');
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
            console.log("MongoDB Connected successfully.");
            return mongooseInstance;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    // MANDATORY MODEL REGISTRATION
    // We import them here to ensure they are registered on the singleton mongoose instance.
    // This solves the 'Cannot read properties of undefined (reading create)' bug permanently.
    await import("@/mongodb/models/User");
    await import("@/mongodb/models/Task");
    await import("@/mongodb/models/AuditLog");
    await import("@/mongodb/models/Proof");
    await import("@/mongodb/models/ProofLink");
    await import("@/mongodb/models/Template");

    return cached.conn;
}

export default connectDB;
