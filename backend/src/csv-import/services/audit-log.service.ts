/**
 * audit-log.service.ts - Audit Log Service
 *
 * This service handles logging of all user actions for audit purposes.
 * It provides methods to create audit log entries for various actions.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity, AuditAction } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  /**
   * Constructor - Dependency Injection
   * @InjectRepository injects the TypeORM repository for AuditLogEntity
   */
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  /**
   * logAction - Creates an audit log entry for an action
   *
   * @param action - The type of action performed
   * @param options - Additional information about the action
   * @returns The created audit log entry
   */
  async logAction(
    action: AuditAction,
    options?: {
      uploadId?: string;
      fileName?: string;
      userIp?: string;
      userAgent?: string;
      details?: Record<string, any>;
      status?: 'success' | 'failed';
      errorMessage?: string;
    },
  ): Promise<AuditLogEntity> {
    const auditLog = this.auditLogRepository.create({
      action,
      uploadId: options?.uploadId,
      fileName: options?.fileName,
      userIp: options?.userIp,
      userAgent: options?.userAgent,
      details: options?.details,
      status: options?.status || 'success',
      errorMessage: options?.errorMessage,
    });

    return await this.auditLogRepository.save(auditLog);
  }

  /**
   * getAuditLogs - Retrieves audit logs with optional filtering
   *
   * @param filters - Filter options (action, uploadId, date range, etc.)
   * @param page - Page number for pagination
   * @param limit - Number of records per page
   * @returns Paginated audit logs
   */
  async getAuditLogs(
    filters?: {
      action?: AuditAction;
      uploadId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    logs: AuditLogEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log');

    // Apply filters
    if (filters?.action) {
      queryBuilder.andWhere('audit_log.action = :action', { action: filters.action });
    }

    if (filters?.uploadId) {
      queryBuilder.andWhere('audit_log.uploadId = :uploadId', { uploadId: filters.uploadId });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('audit_log.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('audit_log.createdAt <= :endDate', { endDate: filters.endDate });
    }

    // Order by most recent first
    queryBuilder.orderBy('audit_log.createdAt', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const logs = await queryBuilder.getMany();

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}


