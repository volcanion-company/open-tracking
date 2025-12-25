import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import config from '@/config';

// Custom error class
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: string[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Token storage abstraction (prepared for auth)
class TokenStorage {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}

export const tokenStorage = new TokenStorage();

// HTTP Client with interceptors
class HttpClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: config.api.baseUrl,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token if available
    this.instance.interceptors.request.use(
      (requestConfig) => {
        // Add auth token when feature is enabled
        if (config.features.enableAuth) {
          const token = tokenStorage.getToken();
          if (token) {
            requestConfig.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Note: API Key should be passed directly in headers when calling the API
        // Example: httpClient.post(url, data, { headers: { 'X-Api-Key': key } })

        return requestConfig;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors globally
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 - Unauthorized (refresh token logic here)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // TODO: Implement token refresh logic when auth is enabled
          // const refreshToken = tokenStorage.getRefreshToken();
          // if (refreshToken) {
          //   try {
          //     const newToken = await this.refreshAccessToken(refreshToken);
          //     tokenStorage.setToken(newToken);
          //     return this.instance(originalRequest);
          //   } catch (refreshError) {
          //     tokenStorage.clearTokens();
          //     window.location.href = '/login';
          //   }
          // }

          // For now, just clear tokens and redirect
          if (config.features.enableAuth) {
            tokenStorage.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }

        // Transform error to ApiError
        const apiError = this.transformError(error);
        return Promise.reject(apiError);
      }
    );
  }

  private transformError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error status
      const data = error.response.data as any;
      return new ApiError(
        data?.message || error.message,
        error.response.status,
        data?.errors
      );
    } else if (error.request) {
      // Request made but no response
      return new ApiError('No response from server', undefined, ['Network error']);
    } else {
      // Something else happened
      return new ApiError(error.message);
    }
  }

  // HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<any>(url, config);
    // Unwrap API response if it's wrapped in { success, data, ... } format
    return this.unwrapResponse<T>(response.data);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<any>(url, data, config);
    return this.unwrapResponse<T>(response.data);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<any>(url, data, config);
    return this.unwrapResponse<T>(response.data);
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<any>(url, data, config);
    return this.unwrapResponse<T>(response.data);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<any>(url, config);
    return this.unwrapResponse<T>(response.data);
  }

  // Unwrap API response wrapper
  private unwrapResponse<T>(responseData: any): T {
    // If response has 'data' property and 'success' flag, unwrap it
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      // For paginated responses, return the data.data array
      if (responseData.data && 'data' in responseData.data) {
        return responseData.data.data as T;
      }
      return responseData.data as T;
    }
    // Otherwise return as-is
    return responseData as T;
  }

  // Get axios instance for custom usage
  getAxiosInstance(): AxiosInstance {
    return this.instance;
  }
}

// Export singleton instance
export const httpClient = new HttpClient();
export default httpClient;
