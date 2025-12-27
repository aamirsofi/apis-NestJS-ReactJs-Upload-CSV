/**
 * audit-log.entity.ts - Audit Log Database Entity
 *
 * This file defines the database table structure for audit logs.
 * TypeORM uses this class to create and manage the 'audit_logs' table.
 *
 * Audit logs track all user actions for security and compliance purposes.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Audit Action Types
 * Defines the types of actions that can be logged
 */
export enum AuditAction {
  UPLOAD = 'upload',
  EXPORT = 'export',
  DELETE = 'delete',
  VIEW_DATA = 'view_data',
  DOWNLOAD_ORIGINAL = 'download_original',
  BULK_DELETE = 'bulk_delete',
}

/**
 * @Entity('audit_logs') - Maps this class to 'audit_logs' table
 * TypeORM will create this table automatically when synchronize is enabled
 */
@Entity('audit_logs')
@Index(['action', 'createdAt']) // Index for faster queries by action and date
@Index(['uploadId']) // Index for faster queries by upload ID
export class AuditLogEntity {
  /**
   * Primary Key - Auto-generated UUID
   * Each audit log entry gets a unique ID automatically
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Action Column
   * The type of action performed (upload, export, delete, etc.)
   * Type: ENUM - Only allows specific values
   */
  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  /**
   * Upload ID Column
   * References the upload record this action relates to
   * nullable: true - Some actions may not be tied to a specific upload
   * Type: VARCHAR(36) - UUID string
   */
  @Column({ type: 'varchar', length: 36, nullable: true })
  uploadId?: string;

  /**
   * File Name Column
   * The name of the file involved in the action
   * nullable: true - Some actions may not involve a file
   * Type: VARCHAR(255)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName?: string;

  /**
   * User IP Column
   * IP address of the user who performed the action
   * nullable: true - May not always be available
   * Type: VARCHAR(45) - Supports IPv6
   */
  @Column({ type: 'varchar', length: 45, nullable: true })
  userIp?: string;

  /**
   * User Agent Column
   * Browser/client information
   * nullable: true - May not always be available
   * Type: TEXT
   */
  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  /**
   * Details Column
   * Additional information about the action (JSON format)
   * nullable: true - Not all actions need extra details
   * Type: JSONB - PostgreSQL JSON format
   */
  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, any>;

  /**
   * Status Column
   * Whether the action was successful or failed
   * Type: VARCHAR(20)
   */
  @Column({ type: 'varchar', length: 20, default: 'success' })
  status: string;

  /**
   * Error Message Column
   * Error message if the action failed
   * nullable: true - Only set if action failed
   * Type: TEXT
   */
  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  /**
   * Created At Column
   * Automatically set when log entry is created
   * Type: TIMESTAMP
   */
  @CreateDateColumn()
  createdAt: Date;
}


