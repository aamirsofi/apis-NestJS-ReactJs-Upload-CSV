import { ApiProperty } from '@nestjs/swagger';
import { AuditAction } from '../entities/audit-log.entity';

export class AuditLogDto {
  @ApiProperty({ description: 'Audit log ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Action type', enum: AuditAction })
  action: AuditAction;

  @ApiProperty({ description: 'Upload ID (if applicable)', required: false, nullable: true })
  uploadId?: string;

  @ApiProperty({ description: 'User ID who performed the action', required: false, nullable: true })
  userId?: string;

  @ApiProperty({ description: 'User email (if available)', required: false, nullable: true })
  userEmail?: string;

  @ApiProperty({ description: 'User name (if available)', required: false, nullable: true })
  userName?: string;

  @ApiProperty({ description: 'File name (if applicable)', required: false, nullable: true })
  fileName?: string;

  @ApiProperty({ description: 'User IP address', required: false, nullable: true })
  userIp?: string;

  @ApiProperty({ description: 'User agent', required: false, nullable: true })
  userAgent?: string;

  @ApiProperty({ description: 'Additional details', required: false, nullable: true, type: 'object' })
  details?: Record<string, any>;

  @ApiProperty({ description: 'Status', example: 'success' })
  status: string;

  @ApiProperty({ description: 'Error message (if failed)', required: false, nullable: true })
  errorMessage?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}

export class AuditLogResponseDto {
  @ApiProperty({ description: 'List of audit logs', type: [AuditLogDto] })
  logs: AuditLogDto[];

  @ApiProperty({ description: 'Total number of logs matching filters' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of records per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

