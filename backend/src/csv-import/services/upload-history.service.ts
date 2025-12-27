import { Injectable } from '@nestjs/common';
import { UploadRecord } from '../interfaces/upload-record.interface';
import { UploadStatus } from '../interfaces/upload-status.enum';

@Injectable()
export class UploadHistoryService {
  private uploads: Map<string, UploadRecord> = new Map();
  private uploadsList: UploadRecord[] = [];

  createUploadRecord(
    fileName: string,
    fileSize: number,
  ): UploadRecord {
    const id = this.generateId();
    const record: UploadRecord = {
      id,
      fileName,
      fileSize,
      status: UploadStatus.PROCESSING,
      uploadedAt: new Date(),
    };

    this.uploads.set(id, record);
    this.uploadsList.unshift(record); // Add to beginning for newest first

    return record;
  }

  updateUploadStatus(
    id: string,
    status: UploadStatus,
    data?: {
      totalRows?: number;
      errors?: string[];
      message?: string;
    },
  ): void {
    const record = this.uploads.get(id);
    if (record) {
      record.status = status;
      record.completedAt = new Date();
      if (data) {
        if (data.totalRows !== undefined) {
          record.totalRows = data.totalRows;
        }
        if (data.errors) {
          record.errors = data.errors;
        }
        if (data.message) {
          record.message = data.message;
        }
      }
    }
  }

  getAllUploads(): UploadRecord[] {
    return [...this.uploadsList];
  }

  getUploadById(id: string): UploadRecord | undefined {
    return this.uploads.get(id);
  }

  getUploadsByStatus(status: UploadStatus): UploadRecord[] {
    return this.uploadsList.filter((upload) => upload.status === status);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

