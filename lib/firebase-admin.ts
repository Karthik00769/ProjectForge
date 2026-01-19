import "server-only";
import admin from "firebase-admin";

const getAdminApp = () => {
    if (!admin.apps.length) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;

        if (!projectId || !clientEmail || !privateKey) {
            // During build phase, we might not have these. 
            // Return null or throw a descriptive error that doesn't kill the build if caught.
            console.warn("Firebase Admin credentials missing. Skipping initialization.");
            return null;
        }

        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, "\n"),
            }),
        });
    }
    return admin.apps[0];
};

export const getAdminAuth = () => {
    const app = getAdminApp();
    if (!app) return null as any;
    return admin.auth(app);
};

export const getAdminDb = () => {
    const app = getAdminApp();
    if (!app) return null as any;
    return admin.firestore(app);
};

export const adminAuth = {
    verifyIdToken: async (token: string) => {
        const auth = getAdminAuth();
        if (!auth) throw new Error("Firebase Admin not initialized");
        return auth.verifyIdToken(token);
    },
    // Add other methods as needed, or just export the getter
} as any;

export default admin;
