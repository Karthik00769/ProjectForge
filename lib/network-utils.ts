// Network utility functions for stable requests across slow/unstable connections

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  timeout?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export interface NetworkResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  retries: number;
  duration?: number;
}

// Enhanced retry condition - more comprehensive error detection
const defaultRetryCondition = (error: any): boolean => {
  if (!error) return false;
  
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) return true;
  if (error.name === 'AbortError') return false; // Don't retry user-cancelled requests
  if (error.message?.toLowerCase().includes('timeout')) return true;
  if (error.message?.toLowerCase().includes('network')) return true;
  if (error.message?.toLowerCase().includes('connection')) return true;
  if (error.message?.toLowerCase().includes('dns')) return true;
  
  // HTTP errors that should be retried
  if (error.status >= 500) return true;
  if (error.status === 408) return true; // Request timeout
  if (error.status === 429) return true; // Rate limit
  if (error.status === 502) return true; // Bad gateway
  if (error.status === 503) return true; // Service unavailable
  if (error.status === 504) return true; // Gateway timeout
  
  return false;
};

// Exponential backoff with jitter and connection quality awareness
const calculateDelay = (
  attempt: number, 
  baseDelay: number, 
  maxDelay: number,
  connectionQuality: string = 'fast'
): number => {
  // Adjust base delay based on connection quality
  let adjustedBaseDelay = baseDelay;
  switch (connectionQuality) {
    case 'slow':
      adjustedBaseDelay = baseDelay * 1.5;
      break;
    case 'unstable':
      adjustedBaseDelay = baseDelay * 2;
      break;
  }

  const exponentialDelay = Math.min(adjustedBaseDelay * Math.pow(2, attempt - 1), maxDelay);
  const jitter = Math.random() * 0.3 * exponentialDelay; // Increased jitter
  return exponentialDelay + jitter;
};

// Enhanced network-safe fetch with comprehensive error handling
export async function networkFetch<T = any>(
  url: string, 
  options: RequestInit = {}, 
  retryOptions: RetryOptions = {}
): Promise<NetworkResponse<T>> {
  const startTime = Date.now();
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    timeout = 15000,
    retryCondition = defaultRetryCondition,
    onRetry
  } = retryOptions;

  let lastError: any;
  let retries = 0;
  const connectionQuality = ConnectionMonitor.getInstance().getQuality();

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      // Create timeout controller with connection-aware timeout
      const adjustedTimeout = connectionQuality === 'slow' ? timeout * 1.5 : 
                             connectionQuality === 'unstable' ? timeout * 2 : timeout;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), adjustedTimeout);

      // Merge abort signal with existing signal
      const signal = options.signal 
        ? AbortSignal.any([options.signal, controller.signal])
        : controller.signal;

      // Add connection quality headers
      const enhancedOptions: RequestInit = {
        ...options,
        signal,
        headers: {
          'X-Connection-Quality': connectionQuality,
          'X-Retry-Attempt': attempt.toString(),
          ...options.headers
        }
      };

      const response = await fetch(url, enhancedOptions);
      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).response = response;
        throw error;
      }

      // Success - parse response with timeout protection
      const data = await Promise.race([
        response.json(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('JSON parsing timeout')), 5000)
        )
      ]);

      return {
        data,
        success: true,
        retries,
        duration: Date.now() - startTime
      };

    } catch (error: any) {
      lastError = error;
      
      // Don't retry on the last attempt or if retry condition fails
      if (attempt > maxRetries || !retryCondition(error)) {
        break;
      }

      retries++;
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, error);
      }

      const delay = calculateDelay(attempt, baseDelay, maxDelay, connectionQuality);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    error: lastError?.message || 'Network request failed',
    success: false,
    retries,
    duration: Date.now() - startTime
  };
}

// Enhanced specialized fetch for authenticated requests
export async function authenticatedFetch<T = any>(
  url: string,
  token: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<NetworkResponse<T>> {
  const authOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Client-Version': '1.0.0',
      'X-Request-ID': Math.random().toString(36).substring(7),
      ...options.headers
    }
  };

  // Enhanced retry options for authenticated requests
  const enhancedRetryOptions: RetryOptions = {
    maxRetries: 4, // More retries for auth requests
    baseDelay: 1500,
    maxDelay: 15000,
    timeout: 20000, // Longer timeout for auth
    onRetry: (attempt, error) => {
      console.warn(`Auth request retry ${attempt}:`, error.message);
    },
    ...retryOptions
  };

  return networkFetch<T>(url, authOptions, enhancedRetryOptions);
}

// Batch request handler with concurrency control
export async function batchRequests<T>(
  requests: Array<() => Promise<T>>,
  concurrency: number = 3
): Promise<Array<T | Error>> {
  const results: Array<T | Error> = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];
    
    const promise = request()
      .then(result => {
        results[i] = result;
      })
      .catch(error => {
        results[i] = error;
      });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }

  await Promise.all(executing);
  return results;
}

// Enhanced connection quality detector with better monitoring
export class ConnectionMonitor {
  private static instance: ConnectionMonitor;
  private quality: 'fast' | 'slow' | 'unstable' = 'fast';
  private listeners: Array<(quality: string) => void> = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private consecutiveFailures = 0;
  private lastTestTime = 0;

  static getInstance(): ConnectionMonitor {
    if (!ConnectionMonitor.instance) {
      ConnectionMonitor.instance = new ConnectionMonitor();
    }
    return ConnectionMonitor.instance;
  }

  getQuality(): string {
    return this.quality;
  }

  onQualityChange(callback: (quality: string) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  async testConnection(): Promise<void> {
    const now = Date.now();
    
    // Throttle tests to avoid spam
    if (now - this.lastTestTime < 5000) return;
    this.lastTestTime = now;

    const start = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
        headers: {
          'X-Connection-Test': 'true'
        }
      });
      
      clearTimeout(timeoutId);
      const duration = Date.now() - start;
      
      if (!response.ok) {
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= 3) {
          this.updateQuality('unstable');
        } else {
          this.updateQuality('slow');
        }
      } else {
        this.consecutiveFailures = 0;
        if (duration > 5000) {
          this.updateQuality('slow');
        } else if (duration > 2000) {
          this.updateQuality(this.quality === 'fast' ? 'fast' : 'slow');
        } else {
          this.updateQuality('fast');
        }
      }
    } catch (error: any) {
      this.consecutiveFailures++;
      if (error.name === 'AbortError' || this.consecutiveFailures >= 2) {
        this.updateQuality('unstable');
      } else {
        this.updateQuality('slow');
      }
    }
  }

  private updateQuality(newQuality: 'fast' | 'slow' | 'unstable'): void {
    if (this.quality !== newQuality) {
      console.log(`Connection quality changed: ${this.quality} → ${newQuality}`);
      this.quality = newQuality;
      this.listeners.forEach(callback => callback(newQuality));
    }
  }

  startMonitoring(interval: number = 30000): () => void {
    if (this.isMonitoring) return this.stopMonitoring;
    
    this.isMonitoring = true;
    
    // Initial test
    this.testConnection();
    
    // Set up periodic testing
    this.monitoringInterval = setInterval(() => {
      this.testConnection();
    }, interval);

    // Monitor online/offline events
    const handleOnline = () => {
      console.log('Connection restored');
      this.consecutiveFailures = 0;
      this.testConnection();
    };

    const handleOffline = () => {
      console.log('Connection lost');
      this.updateQuality('unstable');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      this.stopMonitoring();
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }

  private stopMonitoring = (): void => {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  };
}

// Get network-aware options based on connection quality
export function getNetworkAwareOptions(quality: string = 'fast'): RetryOptions {
  switch (quality) {
    case 'slow':
      return {
        maxRetries: 5,
        baseDelay: 2000,
        maxDelay: 20000,
        timeout: 30000
      };
    case 'unstable':
      return {
        maxRetries: 7,
        baseDelay: 3000,
        maxDelay: 30000,
        timeout: 45000
      };
    default:
      return {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        timeout: 15000
      };
  }
}

// Optimistic UI helper
export class OptimisticUpdater<T> {
  private originalData: T;
  private updateCallback: (data: T) => void;
  private revertCallback: (data: T) => void;

  constructor(
    originalData: T,
    updateCallback: (data: T) => void,
    revertCallback: (data: T) => void
  ) {
    this.originalData = originalData;
    this.updateCallback = updateCallback;
    this.revertCallback = revertCallback;
  }

  async execute(
    optimisticData: T,
    asyncOperation: () => Promise<T>
  ): Promise<T> {
    // Apply optimistic update
    this.updateCallback(optimisticData);

    try {
      // Execute actual operation
      const result = await asyncOperation();
      this.updateCallback(result);
      return result;
    } catch (error) {
      // Revert on failure
      this.revertCallback(this.originalData);
      throw error;
    }
  }
}

// Enhanced error boundary for network errors
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  const name = error.name?.toLowerCase() || '';
  
  return (
    name.includes('network') ||
    name.includes('fetch') ||
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('dns') ||
    error.status >= 500 ||
    error.status === 408 ||
    error.status === 429 ||
    error.status === 502 ||
    error.status === 503 ||
    error.status === 504
  );
}

// Graceful degradation helper
export function withGracefulDegradation<T>(
  primaryOperation: () => Promise<T>,
  fallbackOperation: () => Promise<T> | T,
  shouldFallback: (error: any) => boolean = isNetworkError
): Promise<T> {
  return primaryOperation().catch(async (error) => {
    if (shouldFallback(error)) {
      console.warn('Primary operation failed, using fallback:', error.message);
      return await fallbackOperation();
    }
    throw error;
  });
}

// Initialize connection monitoring on client side
if (typeof window !== 'undefined') {
  const monitor = ConnectionMonitor.getInstance();
  monitor.startMonitoring();
  
  // Integrate with toast system
  let networkToastManager: any;
  import('./toast-utils').then(({ NetworkToastManager }) => {
    networkToastManager = NetworkToastManager.getInstance();
    
    monitor.onQualityChange((quality) => {
      if (quality === 'slow' && networkToastManager) {
        networkToastManager.handleSlowConnection();
      } else if (quality === 'fast' && networkToastManager) {
        networkToastManager.handleFastConnection();
      }
    });
  });
  
  // Expose for debugging
  (window as any).__connectionMonitor = monitor;
}