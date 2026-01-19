import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let googleProvider: GoogleAuthProvider;

if (typeof window !== "undefined" || (firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined")) {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        app = {} as FirebaseApp;
        auth = {} as Auth;
        googleProvider = {} as GoogleAuthProvider;
    }
} else {
    // Fallback for build time / server-side without env vars
    app = {} as FirebaseApp;
    auth = {} as Auth;
    googleProvider = {} as GoogleAuthProvider;
}

export { app, auth, googleProvider };
