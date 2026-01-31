// Network utility functions for stable requests across slow/unstable connections

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  timeout?: number;
  retryCondition?: (error: any) => boolean;
}

export interface NetworkResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  retries: number;
}

// Default retry condition - retry on network errors, timeouts, and 5xx errors
const defaultRetryCondition = (error: any): boolean => {
  if (!error) return false;
  
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) return true;
  if (error.message?.includes('timeout')) return true;
  if (error.message?.includes('network')) return true;
  
  // HTTP errors
  if (error.status >= 500) return true;
  if (error.status === 408) return true; // Request timeout
  if (error.status === 429) return true; // Rate limit
  
  return false;
};

// Exponential backoff with jitter
const calculateDelay = (attempt: number, baseDelay: number, maxDelay: number): number => {
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  const jitter = Math.random() * 0.1 * exponentialDelay;
  return exponentialDelay + jitter;
};

// Network-safe fetch with retry logic and timeout
export async function networkFetch<T = any>(
  url: string, 
  options: RequestInit = {}, 
  retryOptions: RetryOptions = {}
): Promise<NetworkResponse<T>> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    timeout = 15000,
    retryCondition = defaultRetryCondition
  } = retryOptions;

  let lastError: any;
  let retries = 0;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Merge abort signal with existing signal
      const signal = options.signal 
        ? AbortSignal.any([options.signal, controller.signal])
        : controller.signal;

      const response = await fetch(url, {
        ...options,
        signal
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || `HTTP ${response.status}`);
        (error as any).status = response.status;
        (error as any).response = response;
        throw error;
      }

      // Success - parse response
      const data = await response.json();
      return {
        data,
        success: true,
        retries
      };

    } catch (error: any) {
      lastError = error;
      
      // Don't retry on the last attempt or if retry condition fails
      if (attempt > maxRetries || !retryCondition(error)) {
        break;
      }

      retries++;
      const delay = calculateDelay(attempt, baseDelay, maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    error: lastError?.message || 'Network request failed',
    success: false,
    retries
  };
}

// Specialized fetch for authenticated requests
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
      ...options.headers
    }
  };

  return networkFetch<T>(url, authOptions, retryOptions);
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

// Connection quality detector
export class ConnectionMonitor {
  private static instance: ConnectionMonitor;
  private quality: 'fast' | 'slow' | 'unstable' = 'fast';
  private listeners: Array<(quality: string) => void> = [];

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
    const start = Date.now();
    
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const duration = Date.now() - start;
      
      if (!response.ok) {
        this.updateQuality('unstable');
      } else if (duration > 3000) {
        this.updateQuality('slow');
      } else {
        this.updateQuality('fast');
      }
    } catch {
      this.updateQuality('unstable');
    }
  }

  private updateQuality(newQuality: 'fast' | 'slow' | 'unstable'): void {
    if (this.quality !== newQuality) {
      this.quality = newQuality;
      this.listeners.forEach(callback => callback(newQuality));
    }
  }

  startMonitoring(interval: number = 30000): () => void {
    const intervalId = setInterval(() => this.testConnection(), interval);
    this.testConnection(); // Initial test
    
    return () => clearInterval(intervalId);
  }
}

// React hook for network-aware requests
export function getNetworkAwareOptions(connectionQuality: string): RetryOptions {
  switch (connectionQuality) {
    case 'slow':
      return {
        maxRetries: 5,
        baseDelay: 2000,
        maxDelay: 15000,
        timeout: 30000
      };
    case 'unstable':
      return {
        maxRetries: 7,
        baseDelay: 3000,
        maxDelay: 20000,
        timeout: 45000
      };
    default: // fast
      return {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        timeout: 15000
      };
  }
}