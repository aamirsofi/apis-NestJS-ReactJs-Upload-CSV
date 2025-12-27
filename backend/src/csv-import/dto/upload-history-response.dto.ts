import { UploadRecord } from '../interfaces/upload-record.interface';

export class UploadHistoryResponseDto {
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
