import { toast } from "sonner";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

// Enhanced toast utilities with better UX
export const toastUtils = {
  // Success toasts
  success: (message: string, options?: { description?: string; duration?: number }) => {
    return toast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: CheckCircle2,
    });
  },

  // Error toasts with retry functionality
  error: (message: string, options?: { 
    description?: string; 
    duration?: number; 
    action?: { label: string; onClick: () => void } 
  }) => {
    return toast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      icon: AlertCircle,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  },

  // Warning toasts
  warning: (message: string, options?: { description?: string; duration?: number }) => {
    return toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      icon: AlertTriangle,
    });
  },

  // Info toasts
  info: (message: string, options?: { description?: string; duration?: number }) => {
    return toast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: Info,
    });
  },

  // Loading toast with promise handling
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      duration: 4000,
    });
  },

  // Network-specific toasts
  network: {
    offline: () => toast.error("You're offline", {
      description: "Please check your internet connection",
      duration: Infinity,
      icon: AlertTriangle,
    }),

    online: () => toast.success("Back online", {
      description: "Your connection has been restored",
      duration: 3000,
      icon: CheckCircle2,
    }),

    slowConnection: () => toast.warning("Slow connection detected", {
      description: "Some features may take longer to load",
      duration: 5000,
      icon: AlertTriangle,
    }),

    retrying: (attempt: number) => toast.info(`Retrying... (${attempt}/3)`, {
      duration: 2000,
      icon: Info,
    }),
  },

  // Auth-specific toasts
  auth: {
    signInSuccess: (name?: string) => toast.success("Welcome back!", {
      description: name ? `Good to see you, ${name}` : "You're now signed in",
      duration: 3000,
    }),

    signUpSuccess: (name?: string) => toast.success("Account created!", {
      description: name ? `Welcome to ProjectForge, ${name}` : "Your account has been created successfully",
      duration: 4000,
    }),

    signOutSuccess: () => toast.success("Signed out", {
      description: "You've been signed out successfully",
      duration: 3000,
    }),

    sessionExpired: () => toast.error("Session expired", {
      description: "Please sign in again to continue",
      duration: 6000,
      action: {
        label: "Sign In",
        onClick: () => window.location.href = "/auth/sign-in",
      },
    }),

    twoFactorRequired: () => toast.info("Two-factor authentication required", {
      description: "Please complete the verification process",
      duration: 5000,
    }),
  },

  // Data operation toasts
  data: {
    saved: (item: string = "Changes") => toast.success(`${item} saved`, {
      duration: 3000,
    }),

    deleted: (item: string) => toast.success(`${item} deleted`, {
      duration: 3000,
    }),

    created: (item: string) => toast.success(`${item} created`, {
      duration: 3000,
    }),

    updated: (item: string) => toast.success(`${item} updated`, {
      duration: 3000,
    }),

    exported: (item: string = "Data") => toast.success(`${item} exported`, {
      description: "Download should start automatically",
      duration: 4000,
    }),

    imported: (item: string = "Data") => toast.success(`${item} imported`, {
      duration: 3000,
    }),

    copied: (item: string = "Content") => toast.success(`${item} copied`, {
      description: "Copied to clipboard",
      duration: 2000,
    }),
  },

  // Dismiss all toasts
  dismissAll: () => toast.dismiss(),

  // Custom toast with full control
  custom: (message: string, options: {
    type?: "success" | "error" | "warning" | "info";
    description?: string;
    duration?: number;
    action?: { label: string; onClick: () => void };
    dismissible?: boolean;
  }) => {
    const { type = "info", ...restOptions } = options;
    
    switch (type) {
      case "success":
        return toastUtils.success(message, restOptions);
      case "error":
        return toastUtils.error(message, restOptions);
      case "warning":
        return toastUtils.warning(message, restOptions);
      default:
        return toastUtils.info(message, restOptions);
    }
  },
};

// Network status toast manager
export class NetworkToastManager {
  private static instance: NetworkToastManager;
  private isOffline = false;
  private slowConnectionToastId: string | number | null = null;

  static getInstance(): NetworkToastManager {
    if (!NetworkToastManager.instance) {
      NetworkToastManager.instance = new NetworkToastManager();
    }
    return NetworkToastManager.instance;
  }

  handleOffline() {
    if (!this.isOffline) {
      this.isOffline = true;
      toastUtils.network.offline();
    }
  }

  handleOnline() {
    if (this.isOffline) {
      this.isOffline = false;
      toastUtils.network.online();
    }
  }

  handleSlowConnection() {
    if (!this.slowConnectionToastId) {
      this.slowConnectionToastId = toastUtils.network.slowConnection();
    }
  }

  handleFastConnection() {
    if (this.slowConnectionToastId) {
      toast.dismiss(this.slowConnectionToastId);
      this.slowConnectionToastId = null;
    }
  }

  handleRetry(attempt: number) {
    toastUtils.network.retrying(attempt);
  }
}

// Initialize network toast manager
if (typeof window !== "undefined") {
  const networkToastManager = NetworkToastManager.getInstance();
  
  window.addEventListener("online", () => networkToastManager.handleOnline());
  window.addEventListener("offline", () => networkToastManager.handleOffline());
}