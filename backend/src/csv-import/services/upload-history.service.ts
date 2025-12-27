import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadRecord } from '../interfaces/upload-record.interface';
import { UploadStatus } from '../interfaces/upload-status.enum';
import { CsvRow } from '../csv-import.service';
import { UploadRecordEntity } from '../entities/upload-record.entity';

@Injectable()
export class UploadHistoryService {
  constructor(
    @InjectRepository(UploadRecordEntity)
    private readonly uploadRepository: Repository<UploadRecordEntity>,
  ) {}

  async createUploadRecord(
    fileName: string,
    fileSize: number,
  ): Promise<UploadRecord> {
    const record = this.uploadRepository.create({
      fileName,
      fileSize,
      status: UploadStatus.PROCESSING,
    });

    const saved = await this.uploadRepository.save(record);
    return this.entityToInterface(saved);
  }

  async updateUploadStatus(
    id: string,
    status: UploadStatus,
    data?: {
      totalRows?: number;
      errors?: string[];
      message?: string;
      csvData?: CsvRow[];
    },
  ): Promise<void> {
    const updateData: Partial<UploadRecordEntity> = {
      status,
      completedAt: new Date(),
    };

    if (data) {
      if (data.totalRows !== undefined) {
        updateData.totalRows = data.totalRows;
      }
      if (data.errors) {
        updateData.errors = data.errors;
      }
      if (data.message) {
        updateData.message = data.message;
      }
      if (data.csvData) {
        updateData.data = data.csvData as Record<string, string>[];
      }
    }

    await this.uploadRepository.update(id, updateData);
  }

  async getAllUploads(): Promise<UploadRecord[]> {
    // Get all records sorted by status priority and date
    const records = await this.uploadRepository
      .createQueryBuilder('upload')
      .orderBy(
        `CASE 
          WHEN upload.status = 'success' THEN 0
          WHEN upload.status = 'processing' THEN 1
          WHEN upload.status = 'failed' THEN 2
          ELSE 3
        END`,
        'ASC',
      )
      .addOrderBy('upload.uploadedAt', 'DESC')
      .getMany();

    return records.map((record) => this.entityToInterface(record));
  }

  async getUploadById(id: string): Promise<UploadRecord | undefined> {
    const record = await this.uploadRepository.findOne({ where: { id } });
    return record ? this.entityToInterface(record) : undefined;
  }

  async getUploadsByStatus(status: UploadStatus): Promise<UploadRecord[]> {
    const records = await this.uploadRepository.find({
      where: { status },
      order: { uploadedAt: 'DESC' },
    });

    return records.map((record) => this.entityToInterface(record));
  }

  private entityToInterface(entity: UploadRecordEntity): UploadRecord {
    return {
      id: entity.id,
      fileName: entity.fileName,
      fileSize: Number(entity.fileSize),
      status: entity.status,
      uploadedAt: entity.uploadedAt,
      completedAt: entity.completedAt,
      totalRows: entity.totalRows,
      errors: entity.errors,
      message: entity.message,
      data: entity.data as CsvRow[] | undefined,
    };
  }
}
