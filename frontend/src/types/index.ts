export interface CsvRow {
  [key: string]: string;
}

export interface CsvData {
  success: boolean;
  message: string;
  data: CsvRow[];
  totalRows: number;
  uploadId?: string;
  warnings?: Array<{ row: number; message: string }>;
  duplicates?: Array<{ row: number; duplicateOf: number; data: CsvRow }>;
  duplicateCount?: number;
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
  data?: CsvRow[]; // CSV data for successful uploads
}

export interface UploadHistoryResponse {
  uploads: UploadRecord[];
  total: number;
  success: number;
  failed: number;
  processing: number;
  // Pagination metadata
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

