"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: FirebaseUser | null;
    mongoUser: any | null; // Profile from MongoDB
    loading: boolean;
    logout: () => Promise<void>;
    syncUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    mongoUser: null,
    loading: true,
    logout: async () => { },
    syncUser: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [mongoUser, setMongoUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const syncUser = async () => {
        if (!auth.currentUser) return;
        try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`/api/auth/sync?t=${Date.now()}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setMongoUser(data.user);
            }
        } catch (error) {
            console.error("Error syncing user:", error);
        }
    };

    useEffect(() => {
        if (!auth || typeof auth.onAuthStateChanged !== 'function') {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                await syncUser();
            } else {
                setUser(null);
                setMongoUser(null);
                // Hard redirect if trying to access dashboard while not logged in
                if (typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard")) {
                    router.replace("/auth/sign-in");
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const logout = async () => {
        try {
            await auth.signOut();
            setUser(null);
            setMongoUser(null);

            // Security: Replace history state so 'Back' button doesn't return to dashboard
            window.history.replaceState(null, "", "/auth/sign-in");
            router.replace("/auth/sign-in");

            // Clear any local caches
            localStorage.clear();
            sessionStorage.clear();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, mongoUser, loading, logout, syncUser }}>
            {children}
        </AuthContext.Provider>
    );
};
