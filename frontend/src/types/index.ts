export interface CsvRow {
  [key: string]: string;
}

export interface CsvData {
  success: boolean;
  message: string;
  data: CsvRow[];
  totalRows: number;
  uploadId?: string;
}

export enum UploadStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PROCESSING = 'processing',
}

export interface UploadRecord {
  id: string;
  fileName: string;
  fileSize: number;
  status: UploadStatus;
  uploadedAt: string;
  completedAt?: string;
  totalRows?: number;
  errors?: string[];
  message?: string;
}

export interface UploadHistoryResponse {
  uploads: UploadRecord[];
  total: number;
  success: number;
  failed: number;
  processing: number;
}

