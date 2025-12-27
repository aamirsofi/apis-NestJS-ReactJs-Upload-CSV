import { UploadStatus } from './upload-status.enum';

export interface UploadRecord {
  id: string;
  fileName: string;
  fileSize: number;
  status: UploadStatus;
  uploadedAt: Date;
  completedAt?: Date;
  totalRows?: number;
  errors?: string[];
  message?: string;
}

