// Auth-aware routing utilities for production-grade SaaS behavior
"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

export interface AuthRouteOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  preserveRedirect?: boolean;
}

// Hook for auth-aware navigation
export function useAuthRouter() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigateWithAuth = (
    targetPath: string,
    options: AuthRouteOptions = {}
  ) => {
    const {
      requireAuth = true,
      redirectTo,
      preserveRedirect = true,
    } = options;

    if (loading) return; // Wait for auth state

    if (requireAuth && !user) {
      // User not authenticated - redirect to sign-up for new users, sign-in for returning
      const authPath = redirectTo || "/auth/sign-up";
      const redirectParam = preserveRedirect 
        ? `?redirect=${encodeURIComponent(targetPath)}`
        : "";
      
      router.push(`${authPath}${redirectParam}`);
      return;
    }

    if (!requireAuth && user) {
      // User already authenticated - go directly to target
      router.push(targetPath);
      return;
    }

    // Normal navigation
    router.push(targetPath);
  };

  const handlePostAuthRedirect = () => {
    const redirect = searchParams.get("redirect");
    if (redirect && user) {
      router.replace(decodeURIComponent(redirect));
      return true;
    }
    return false;
  };

  return {
    navigateWithAuth,
    handlePostAuthRedirect,
    isAuthenticated: !!user,
    isLoading: loading,
  };
}

// Component wrapper for auth-protected routes
export function withAuthProtection<P extends object>(
  Component: React.ComponentType<P>,
  options: AuthRouteOptions = {}
) {
  return function AuthProtectedComponent(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
      if (loading) return;

      const { requireAuth = true, redirectTo = "/auth/sign-in" } = options;

      if (requireAuth && !user) {
        const currentPath = window.location.pathname;
        const redirectParam = `?redirect=${encodeURIComponent(currentPath)}`;
        router.replace(`${redirectTo}${redirectParam}`);
        return;
      }

      setIsChecking(false);
    }, [user, loading, router]);

    if (loading || isChecking) {
      return React.createElement('div', {
        className: "min-h-screen flex items-center justify-center"
      }, React.createElement('div', {
        className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
      }));
    }

    return React.createElement(Component, props);
  };
}

// Smart auth button component
export function AuthAwareButton({
  targetPath,
  children,
  className = "",
  variant = "default",
  size = "default",
  ...props
}: {
  targetPath: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  [key: string]: any;
}) {
  const { navigateWithAuth } = useAuthRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigateWithAuth(targetPath);
  };

  // Dynamic import to avoid SSR issues
  const [Button, setButton] = useState<any>(null);

  useEffect(() => {
    import("@/components/ui/button").then((mod) => {
      setButton(() => mod.Button);
    });
  }, []);

  if (!Button) {
    return React.createElement('button', {
      onClick: handleClick,
      className: `px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition ${className}`,
      ...props
    }, children);
  }

  return React.createElement(Button, {
    onClick: handleClick,
    variant: variant,
    size: size,
    className: className,
    ...props
  }, children);
}