/**
 * upload-record.entity.ts - Upload Record Database Entity
 *
 * This file defines the database table structure for upload records.
 * TypeORM uses this class to create and manage the 'upload_records' table.
 *
 * What is an Entity?
 * - Represents a database table
 * - Each property becomes a column
 * - Decorators define column types and constraints
 * - TypeORM automatically creates/manages the table
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { UploadStatus } from '../interfaces/upload-status.enum';

/**
 * @Entity('upload_records') - Maps this class to 'upload_records' table
 * TypeORM will create this table automatically when synchronize is enabled
 */
@Entity('upload_records')
export class UploadRecordEntity {
  /**
   * Primary Key - Auto-generated UUID
   * Each upload gets a unique ID automatically
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * File Name Column
   * Stores the original filename of the uploaded CSV
   * Type: VARCHAR(255) - Text up to 255 characters
   */
  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  /**
   * File Size Column
   * Stores the file size in bytes
   * Type: BIGINT - Large integer for file sizes
   */
  @Column({ type: 'bigint' })
  fileSize: number;

  /**
   * Status Column
   * Tracks the upload status: success, failed, or processing
   * Type: ENUM - Only allows specific values
   * Default: PROCESSING (when record is first created)
   */
  @Column({
    type: 'enum',
    enum: UploadStatus,
    default: UploadStatus.PROCESSING,
  })
  status: UploadStatus;

  /**
   * Uploaded At Column
   * Automatically set when record is created
   * Type: TIMESTAMP - Date and time
   */
  @CreateDateColumn()
  uploadedAt: Date;

  /**
   * Completed At Column
   * Set when processing finishes (success or failure)
   * nullable: true - Can be null if still processing
   * Type: TIMESTAMP
   */
  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  /**
   * Total Rows Column
   * Number of rows in the CSV file (only for successful uploads)
   * nullable: true - Not set for failed uploads
   * Type: INT - Integer
   */
  @Column({ type: 'int', nullable: true })
  totalRows?: number;

  /**
   * Errors Column
   * Array of error messages (for failed uploads)
   * nullable: true - Only set if upload failed
   * Type: JSONB - PostgreSQL JSON format (efficient for arrays)
   */
  @Column({ type: 'jsonb', nullable: true })
  errors?: string[];

  /**
   * Message Column
   * Status message (e.g., "CSV file imported successfully")
   * nullable: true - Optional message
   * Type: TEXT - Unlimited text length
   */
  @Column({ type: 'text', nullable: true })
  message?: string;

  /**
   * Data Column
   * The parsed CSV data (only for successful uploads)
   * Stores the actual CSV content as JSON
   * nullable: true - Only set for successful uploads
   * Type: JSONB - PostgreSQL JSON format (efficient storage)
   */
  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, string>[]; // CSV data stored as JSONB

  /**
   * Original File Column
   * Stores the original CSV file content as binary data.
   * This allows users to download the original file.
   * Nullable, as it's optional and can be large.
   */
  @Column({ type: 'bytea', nullable: true })
  originalFile?: Buffer; // Original file content for download
}
