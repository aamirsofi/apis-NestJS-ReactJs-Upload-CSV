import { UploadRecord } from '../interfaces/upload-record.interface';

export class UploadHistoryResponseDto {
  uploads: UploadRecord[];
  total: number;
  success: number;
  failed: number;
  processing: number;
}
