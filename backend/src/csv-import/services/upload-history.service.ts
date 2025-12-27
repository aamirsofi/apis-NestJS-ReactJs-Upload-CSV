import { Injectable } from '@nestjs/common';
import { UploadRecord } from '../interfaces/upload-record.interface';
import { UploadStatus } from '../interfaces/upload-status.enum';
import { CsvRow } from '../csv-import.service';

@Injectable()
export class UploadHistoryService {
  private uploads: Map<string, UploadRecord> = new Map();
  private uploadsList: UploadRecord[] = [];

  createUploadRecord(fileName: string, fileSize: number): UploadRecord {
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
      csvData?: CsvRow[];
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
        if (data.csvData) {
          record.data = data.csvData;
        }
      }
    }
  }

  getAllUploads(): UploadRecord[] {
    // Sort: success first, processing middle, failed last - then by date (newest first) within each group
    return [...this.uploadsList].sort((a, b) => {
      // Define priority: SUCCESS = 0, PROCESSING = 1, FAILED = 2
      const getPriority = (status: UploadStatus): number => {
        switch (status) {
          case UploadStatus.SUCCESS:
            return 0;
          case UploadStatus.PROCESSING:
            return 1;
          case UploadStatus.FAILED:
            return 2;
          default:
            return 3;
        }
      };

      const priorityA = getPriority(a.status);
      const priorityB = getPriority(b.status);

      // If priorities are different, sort by priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If same priority, sort by date (newest first)
      return b.uploadedAt.getTime() - a.uploadedAt.getTime();
    });
  }

  getUploadById(id: string): UploadRecord | undefined {
    return this.uploads.get(id);
  }

  getUploadsByStatus(status: UploadStatus): UploadRecord[] {
    // Sort by date (newest first) when filtering by status
    return this.uploadsList
      .filter((upload) => upload.status === status)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
