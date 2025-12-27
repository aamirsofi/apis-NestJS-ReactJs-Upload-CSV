/**
 * upload-history.service.ts - Upload History Service
 *
 * This service manages upload records in the database.
 * It handles all database operations related to tracking CSV file uploads.
 *
 * Responsibilities:
 * - Create new upload records
 * - Update upload status (success/failed/processing)
 * - Retrieve upload history
 * - Filter uploads by status
 * - Convert database entities to interface objects
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UploadRecord } from '../interfaces/upload-record.interface';
import { UploadStatus } from '../interfaces/upload-status.enum';
import { CsvRow } from '../csv-import.service';
import { UploadRecordEntity } from '../entities/upload-record.entity';

@Injectable()
export class UploadHistoryService {
  /**
   * Constructor - Dependency Injection
   * @InjectRepository injects the TypeORM repository for UploadRecordEntity
   * This repository provides methods to interact with the database table
   */
  constructor(
    @InjectRepository(UploadRecordEntity)
    private readonly uploadRepository: Repository<UploadRecordEntity>,
  ) {}

  /**
   * createUploadRecord - Creates a new upload record in the database
   *
   * @param fileName - Name of the uploaded file
   * @param fileSize - Size of the file in bytes
   * @returns Created upload record with generated ID
   *
   * This is called when a file upload starts.
   * Creates a record with status PROCESSING.
   */
  async createUploadRecord(
    fileName: string,
    fileSize: number,
  ): Promise<UploadRecord> {
    // Create a new entity instance (not saved yet)
    const record = this.uploadRepository.create({
      fileName,
      fileSize,
      status: UploadStatus.PROCESSING, // Start with processing status
    });

    // Save to database and get the saved record (with generated ID)
    const saved = await this.uploadRepository.save(record);
    // Convert database entity to interface and return
    return this.entityToInterface(saved);
  }

  /**
   * updateUploadStatus - Updates an upload record's status and related data
   *
   * @param id - Upload record ID
   * @param status - New status (SUCCESS, FAILED, or PROCESSING)
   * @param data - Optional data to update (rows, errors, message, CSV data)
   *
   * This is called after CSV parsing completes (success or failure).
   * Updates the record with final status and stores CSV data if successful.
   */
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
    // Prepare update data
    const updateData: Partial<UploadRecordEntity> = {
      status,
      completedAt: new Date(), // Mark when processing completed
    };

    // Add optional data if provided
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
        // Store CSV data as JSONB in database
        updateData.data = data.csvData as Record<string, string>[];
      }
    }

    // Update the record in database
    await this.uploadRepository.update(id, updateData);
  }

  /**
   * getAllUploads - Retrieves all upload records with smart sorting
   *
   * @returns Array of upload records sorted by:
   *   1. Status priority: success → processing → failed
   *   2. Date: newest first within each status group
   *
   * This ensures successful uploads appear at the top of the list.
   */
  async getAllUploads(): Promise<UploadRecord[]> {
    // Use QueryBuilder for complex sorting
    // Sort by status priority first, then by date
    const records = await this.uploadRepository
      .createQueryBuilder('upload')
      .orderBy(
        `CASE 
          WHEN upload.status = 'success' THEN 0
          WHEN upload.status = 'processing' THEN 1
          WHEN upload.status = 'failed' THEN 2
          ELSE 3
        END`,
        'ASC', // Lower numbers first (success = 0 comes first)
      )
      .addOrderBy('upload.uploadedAt', 'DESC') // Newest first
      .getMany();

    // Convert all entities to interface objects
    return records.map((record) => this.entityToInterface(record));
  }

  /**
   * getUploadById - Retrieves a specific upload record by ID
   *
   * @param id - Upload record ID (UUID)
   * @returns Upload record or undefined if not found
   */
  async getUploadById(id: string): Promise<UploadRecord | undefined> {
    // Find one record matching the ID
    const record = await this.uploadRepository.findOne({ where: { id } });
    // Convert to interface if found, otherwise return undefined
    return record ? this.entityToInterface(record) : undefined;
  }

  /**
   * getUploadsByStatus - Retrieves uploads filtered by status
   *
   * @param status - Status to filter by (SUCCESS, FAILED, or PROCESSING)
   * @returns Array of upload records with the specified status, sorted by date (newest first)
   */
  async getUploadsByStatus(status: UploadStatus): Promise<UploadRecord[]> {
    // Find all records with matching status
    const records = await this.uploadRepository.find({
      where: { status },
      order: { uploadedAt: 'DESC' }, // Newest first
    });

    // Convert all entities to interface objects
    return records.map((record) => this.entityToInterface(record));
  }

  /**
   * getUploadsWithFilters - Retrieves uploads with advanced filtering and pagination
   *
   * @param filters - Filter criteria object
   * @param page - Page number (1-based)
   * @param limit - Number of records per page
   * @returns Object containing filtered upload records and pagination metadata
   */
  async getUploadsWithFilters(
    filters: {
      status?: UploadStatus;
      search?: string;
      startDate?: Date;
      endDate?: Date;
      minSize?: number;
      maxSize?: number;
    },
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    records: UploadRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Build query with filters
    const queryBuilder = this.uploadRepository.createQueryBuilder('upload');

    // Status filter
    if (filters.status) {
      queryBuilder.andWhere('upload.status = :status', { status: filters.status });
    }

    // Filename search filter (case-insensitive partial match)
    if (filters.search && filters.search.trim()) {
      queryBuilder.andWhere('LOWER(upload.fileName) LIKE LOWER(:search)', {
        search: `%${filters.search.trim()}%`,
      });
    }

    // Date range filters
    if (filters.startDate) {
      queryBuilder.andWhere('upload.uploadedAt >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters.endDate) {
      queryBuilder.andWhere('upload.uploadedAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    // File size filters
    if (filters.minSize !== undefined) {
      queryBuilder.andWhere('upload.fileSize >= :minSize', {
        minSize: filters.minSize,
      });
    }
    if (filters.maxSize !== undefined) {
      queryBuilder.andWhere('upload.fileSize <= :maxSize', {
        maxSize: filters.maxSize,
      });
    }

    // Apply sorting: status priority first, then date
    queryBuilder.orderBy(
      `CASE 
        WHEN upload.status = 'success' THEN 0
        WHEN upload.status = 'processing' THEN 1
        WHEN upload.status = 'failed' THEN 2
        ELSE 3
      END`,
      'ASC',
    );
    queryBuilder.addOrderBy('upload.uploadedAt', 'DESC');

    // Get total count BEFORE pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query and convert to interface objects
    const records = await queryBuilder.getMany();
    const mappedRecords = records.map((record) => this.entityToInterface(record));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return {
      records: mappedRecords,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * storeOriginalFile - Stores the original CSV file buffer for later download
   *
   * @param id - Upload record ID
   * @param fileBuffer - Original file buffer
   */
  async storeOriginalFile(id: string, fileBuffer: Buffer): Promise<void> {
    await this.uploadRepository.update(id, {
      originalFile: fileBuffer,
    });
  }

  /**
   * getOriginalFile - Retrieves the original CSV file buffer
   *
   * @param id - Upload record ID
   * @returns Original file buffer or undefined if not found
   */
  async getOriginalFile(id: string): Promise<Buffer | undefined> {
    const record = await this.uploadRepository.findOne({
      where: { id },
      select: ['id', 'originalFile', 'fileName'],
    });
    return record?.originalFile;
  }

  /**
   * getUploadsByIds - Retrieves multiple upload records by IDs
   *
   * @param ids - Array of upload record IDs
   * @returns Array of upload records
   */
  async getUploadsByIds(ids: string[]): Promise<UploadRecord[]> {
    if (ids.length === 0) {
      return [];
    }
    const records = await this.uploadRepository.find({
      where: { id: In(ids) },
    });
    return records.map((record) => this.entityToInterface(record));
  }

  /**
   * deleteUploads - Deletes multiple upload records by IDs
   *
   * @param ids - Array of upload record IDs to delete
   * @returns Number of deleted records
   */
  async deleteUploads(ids: string[]): Promise<number> {
    const result = await this.uploadRepository.delete(ids);
    return result.affected || 0;
  }

  /**
   * entityToInterface - Converts database entity to interface
   *
   * @param entity - Database entity (UploadRecordEntity)
   * @returns Interface object (UploadRecord)
   *
   * This helper method converts TypeORM entities to plain interface objects.
   * It also handles type conversions (e.g., bigint to number).
   */
  private entityToInterface(entity: UploadRecordEntity): UploadRecord {
    return {
      id: entity.id,
      fileName: entity.fileName,
      fileSize: Number(entity.fileSize), // Convert bigint to number
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
