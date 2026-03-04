import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError 
} from "axios";
import toast from "react-hot-toast";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";
const GET_CACHE_TTL_MS = 60_000;

// Type definitions
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Cache management
type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const responseCache = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

class ApiCache {
  private static getCacheKey(path: string, method: Method, token?: string): string {
    return `${method}:${path}:${token || ""}`;
  }

  static readCachedValue<T>(key: string): T | null {
    const entry = responseCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      responseCache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  static writeCachedValue<T>(key: string, value: T): void {
    responseCache.set(key, {
      value,
      expiresAt: Date.now() + GET_CACHE_TTL_MS
    });
  }

  static invalidateGetCache(prefixes: string[]): void {
    for (const key of responseCache.keys()) {
      for (const prefix of prefixes) {
        if (key.startsWith(`GET:${prefix}:`)) {
          responseCache.delete(key);
          break;
        }
      }
    }

    for (const key of inFlightRequests.keys()) {
      for (const prefix of prefixes) {
        if (key.startsWith(`GET:${prefix}:`)) {
          inFlightRequests.delete(key);
          break;
        }
      }
    }
  }

  static createCacheKey(path: string, method: Method, token?: string): string {
    return this.getCacheKey(path, method, token);
  }
}

// Response parsing with toast notifications
class ApiResponseParser {
  static async parseResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const errorMessage = data?.message || `Request failed (${res.status})`;
      
      // Show error toast for failed requests
      if (typeof window !== 'undefined') {
        toast.error(errorMessage, {
          duration: 4000,
          position: 'top-right',
        });
      }
      
      throw new Error(errorMessage);
    }

    if (res.status === 204) return {} as T;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return {} as T;
    
    const text = await res.text();
    if (!text.trim()) return {} as T;
    
    return JSON.parse(text) as T;
  }
}

// HTTP Client with fetch
class FetchHttpClient {
  static async request<T>(
    path: string, 
    method: Method, 
    token?: string, 
    body?: unknown
  ): Promise<T> {
    const cacheKey = ApiCache.createCacheKey(path, method, token);

    if (method === "GET") {
      const cached = ApiCache.readCachedValue<T>(cacheKey);
      if (cached) return cached;

      const pending = inFlightRequests.get(cacheKey);
      if (pending) return pending as Promise<T>;
    }

    const fetchPromise = fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store"
    })
      .then((res) => ApiResponseParser.parseResponse<T>(res))
      .catch((error) => {
        // Handle network errors
        if (typeof window !== 'undefined' && error instanceof Error) {
          toast.error(`Network error: ${error.message}`, {
            duration: 4000,
            position: 'top-right',
          });
        }
        throw error;
      });

    if (method === "GET") {
      const trackedPromise = fetchPromise
        .then((data) => {
          ApiCache.writeCachedValue(cacheKey, data);
          return data;
        })
        .finally(() => {
          inFlightRequests.delete(cacheKey);
        });

      inFlightRequests.set(cacheKey, trackedPromise as Promise<unknown>);
      return trackedPromise;
    }

    return fetchPromise;
  }
}

// Axios HTTP Client with toast notifications
class AxiosHttpClient {
  private static instance: AxiosInstance;

  static getInstance(): AxiosInstance {
    if (!AxiosHttpClient.instance) {
      AxiosHttpClient.instance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      AxiosHttpClient.setupInterceptors();
    }
    return AxiosHttpClient.instance;
  }

  private static setupInterceptors(): void {
    // Request interceptor - show loading toast for mutations
    AxiosHttpClient.instance.interceptors.request.use(
      (config) => {
        // Show loading indicator for POST/PUT/PATCH/DELETE requests
        if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
          // Optional: Show loading toast if needed
          // toast.loading('Processing...', { id: 'api-request' });
        }
        return config;
      },
      (error) => {
        if (typeof window !== 'undefined') {
          toast.error('Request configuration error', {
            duration: 3000,
            position: 'top-right',
          });
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor
    AxiosHttpClient.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Dismiss any loading toasts
        // toast.dismiss('api-request');
        
        // Optional: Show success toast for mutations
        if (response.config.method && 
            ['post', 'put', 'patch', 'delete'].includes(response.config.method.toLowerCase())) {
          // toast.success('Operation completed successfully', {
          //   duration: 3000,
          //   position: 'top-right',
          // });
        }
        
        return response;
      },
      async (error: AxiosError) => {
        // Dismiss loading toasts
        // toast.dismiss('api-request');
        
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        const errorMessage = error.response?.data 
          ? (error.response.data as { message?: string }).message || error.message 
          : error.message;

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Attempt to refresh tokens
            const refreshResponse = await AxiosHttpClient.instance.post(
              "/auth/refresh", 
              {}, 
              { withCredentials: true }
            );

            if (refreshResponse.status === 200) {
              // Retry original request
              return AxiosHttpClient.instance(originalRequest);
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            
            // Clear cache
            ApiCache.invalidateGetCache(["/"]);
            
            // Show session expired toast and redirect
            if (typeof window !== 'undefined') {
              toast.error('Session expired. Please log in again.', {
                duration: 5000,
                position: 'top-right',
                icon: '🔐',
              });
              
              // Delay redirect slightly to allow toast to display
              setTimeout(() => {
                window.location.href = "/login";
              }, 1500);
            }

            return Promise.reject(refreshError);
          }
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
          if (typeof window !== 'undefined') {
            toast.error('Access forbidden. Please check your permissions.', {
              duration: 4000,
              position: 'top-right',
              icon: '⚠️',
            });
            
            setTimeout(() => {
              window.location.href = "/login";
            }, 2000);
          }
          return Promise.reject(error);
        }

        // Handle 400 Bad Request (validation errors)
        if (error.response?.status === 400) {
          if (typeof window !== 'undefined') {
            toast.error(errorMessage || 'Invalid request. Please check your input.', {
              duration: 4000,
              position: 'top-right',
            });
          }
          return Promise.reject(error);
        }

        // Handle 404 Not Found
        if (error.response?.status === 404) {
          if (typeof window !== 'undefined') {
            toast.error('Resource not found.', {
              duration: 3000,
              position: 'top-right',
            });
          }
          return Promise.reject(error);
        }

        // Handle 500 Server Error
        if (error.response?.status === 500) {
          if (typeof window !== 'undefined') {
            toast.error('Server error. Please try again later.', {
              duration: 4000,
              position: 'top-right',
              icon: '🔧',
            });
          }
          return Promise.reject(error);
        }

        // Handle network errors or other axios errors
        if (typeof window !== 'undefined') {
          toast.error(errorMessage || 'An unexpected error occurred. Please try again.', {
            duration: 4000,
            position: 'top-right',
          });
        }

        return Promise.reject(error);
      }
    );
  }
}

// HTTP Client Factory
class HttpClientFactory {
  static createClient(useAxios: boolean = true): {
    request: <T>(path: string, method: Method, token?: string, body?: unknown) => Promise<T>;
    invalidateCache: (prefixes: string[]) => void;
  } {
    if (useAxios) {
      const axiosInstance = AxiosHttpClient.getInstance();
      
      return {
        request: async <T>(
          path: string, 
          method: Method, 
          token?: string, 
          body?: unknown
        ): Promise<T> => {
          const config: AxiosRequestConfig = {
            method: method.toLowerCase() as any,
            url: path,
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            ...(body ? { data: body } : {}),
          };

          try {
            const response = await axiosInstance.request<T>(config);
            return response.data;
          } catch (error) {
            // Error is already handled by interceptors with toasts
            throw error;
          }
        },
        invalidateCache: (prefixes: string[]) => {
          ApiCache.invalidateGetCache(prefixes);
        },
      };
    }

    return {
      request: FetchHttpClient.request,
      invalidateCache: (prefixes: string[]) => {
        ApiCache.invalidateGetCache(prefixes);
      },
    };
  }
}

// Helper function for logout with toast notification
export const handleLogout = (redirectPath: string = "/login"): void => {
  // Clear all auth-related caches
  ApiCache.invalidateGetCache(["/"]);
  
  // Show logout toast
  if (typeof window !== 'undefined') {
    toast.success('Logged out successfully', {
      duration: 3000,
      position: 'top-right',
      icon: '👋',
    });
    
    // Redirect after short delay
    setTimeout(() => {
      window.location.href = redirectPath;
    }, 1000);
  }
};

// Export the HTTP client factory
export const httpClient = HttpClientFactory.createClient(true);
export default httpClient;