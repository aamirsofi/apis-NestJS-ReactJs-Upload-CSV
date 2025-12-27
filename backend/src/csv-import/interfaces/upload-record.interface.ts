import { UploadStatus } from './upload-status.enum';
import { CsvRow } from '../csv-import.service';

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
  data?: CsvRow[]; // Store parsed CSV data for successful uploads
}
