import axios from 'axios';
import { CsvData, UploadHistoryResponse, UploadRecord, UploadStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

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

export default api;

