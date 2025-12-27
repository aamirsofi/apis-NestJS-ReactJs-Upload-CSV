import axios from 'axios';
import { CsvData, UploadHistoryResponse, UploadRecord, UploadStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if it's NOT a login/register request
      // Login/register errors should be handled by the component
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
      
      if (!isAuthEndpoint) {
        // Token expired or invalid - clear auth and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export interface DuplicateDetectionOptions {
  detectDuplicates?: boolean;
  duplicateColumns?: string[];
  handleDuplicates?: 'skip' | 'keep' | 'mark';
  columnMapping?: Record<string, string>;
}

export const uploadCsv = async (
  file: File,
  options?: DuplicateDetectionOptions,
): Promise<CsvData> => {
  const formData = new FormData();
  formData.append('file', file);

  const params: Record<string, string> = {};
  if (options?.detectDuplicates) {
    params.detectDuplicates = 'true';
  }
  if (options?.duplicateColumns && options.duplicateColumns.length > 0) {
    params.duplicateColumns = options.duplicateColumns.join(',');
  }
  if (options?.handleDuplicates) {
    params.handleDuplicates = options.handleDuplicates;
  }
  if (options?.columnMapping && Object.keys(options.columnMapping).length > 0) {
    params.columnMapping = JSON.stringify(options.columnMapping);
  }

  try {
    const response = await api.post<CsvData>('/csv-import/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'Failed to upload CSV file';
      throw new Error(message);
    }
    throw new Error('An unexpected error occurred');
  }
};

export interface UploadHistoryFilters {
  status?: UploadStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  minSize?: number;
  maxSize?: number;
  page?: number;
  limit?: number;
}

export const getUploadHistory = async (
  filters?: UploadHistoryFilters | UploadStatus,
): Promise<UploadHistoryResponse> => {
  try {
    // Support both old API (just status) and new API (filters object)
    let params: Record<string, any> = {};
    
    if (filters) {
      if (typeof filters === 'string') {
        // Old API: just status string
        params.status = filters;
      } else {
        // New API: filters object
        params = { ...filters };
        // Remove undefined values
        Object.keys(params).forEach((key) => {
          if (params[key] === undefined || params[key] === '') {
            delete params[key];
          }
        });
      }
    }
    
    const response = await api.get<UploadHistoryResponse>('/csv-import/history', { params });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch upload history';
      throw new Error(message);
    }
    throw new Error('An unexpected error occurred');
  }
};

export const getUploadById = async (id: string): Promise<UploadRecord> => {
  try {
    const response = await api.get<UploadRecord>(`/csv-import/history/${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch upload details';
      throw new Error(message);
    }
    throw new Error('An unexpected error occurred');
  }
};

export interface UploadDataResponse {
  uploadId: string;
  fileName: string;
  totalRows: number;
  data: CsvRow[];
}

export const getUploadData = async (id: string): Promise<UploadDataResponse> => {
  try {
    const response = await api.get<UploadDataResponse>(`/csv-import/history/${id}/data`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch upload data';
      throw new Error(message);
    }
    throw new Error('An unexpected error occurred');
  }
};

export const downloadOriginalFile = async (id: string, fileName: string): Promise<void> => {
  try {
    const response = await api.get(`/csv-import/history/${id}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'Failed to download file';
      throw new Error(message);
    }
    throw new Error('An unexpected error occurred');
  }
};

export const exportCsvData = async (uploadId: string, fileName: string): Promise<void> => {
  try {
    const response = await api.post(
      '/csv-import/history/export',
      { uploadId },
      { responseType: 'blob' },
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `export_${fileName}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'Failed to export CSV';
      throw new Error(message);
    }
    throw new Error('An unexpected error occurred');
  }
};

export const bulkDeleteUploads = async (ids: string[]): Promise<{ deleted: number; message: string }> => {
  try {
    const response = await api.delete('/csv-import/history/bulk', { data: { ids } });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'Failed to delete uploads';
      throw new Error(message);
    }
    throw new Error('An unexpected error occurred');
  }
};

export interface AuditLog {
  id: string;
  action: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  uploadId?: string;
  fileName?: string;
  userIp?: string;
  userAgent?: string;
  details?: Record<string, any>;
  status: string;
  errorMessage?: string;
  createdAt: string;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogFilters {
  action?: string;
  uploadId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const getAuditLogs = async (filters?: AuditLogFilters): Promise<AuditLogsResponse> => {
  try {
    const params: Record<string, string> = {};
    
    if (filters) {
      if (filters.action) params.action = filters.action;
      if (filters.uploadId) params.uploadId = filters.uploadId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.page) params.page = filters.page.toString();
      if (filters.limit) params.limit = filters.limit.toString();
    }

    const response = await api.get<AuditLogsResponse>('/csv-import/audit-logs', { params });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch audit logs';
      throw new Error(message);
    }
    throw new Error('An unexpected error occurred');
  }
};

// Authentication API functions
export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/register', data);
    // Store token and user info
    localStorage.setItem('authToken', response.data.accessToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(message);
    }
    throw new Error('An unexpected error occurred');
  }
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', data);
    // Store token and user info
    localStorage.setItem('authToken', response.data.accessToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Extract error message from response
      let message = 'Login failed';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.status === 401) {
        message = 'Invalid email or password';
      } else if (error.message) {
        message = error.message;
      }
      throw new Error(message);
    }
    throw new Error('An unexpected error occurred');
  }
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await api.get<User>('/auth/me');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'Failed to get user';
      throw new Error(message);
    }
    throw new Error('An unexpected error occurred');
  }
};

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('authToken');
};

export default api;

