import axios from 'axios';
import { CsvData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const uploadCsv = async (file: File): Promise<CsvData> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post<CsvData>('/csv-import/upload', formData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'Failed to upload CSV file';
      throw new Error(message);
    }
    throw new Error('An unexpected error occurred');
  }
};

export default api;

