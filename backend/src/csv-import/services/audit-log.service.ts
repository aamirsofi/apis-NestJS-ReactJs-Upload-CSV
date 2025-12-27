/**
 * audit-log.service.ts - Audit Log Service
 *
 * This service handles logging of all user actions for audit purposes.
 * It provides methods to create audit log entries for various actions.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AuditLogEntity, AuditAction } from '../entities/audit-log.entity';
import { UserEntity } from '../../auth/entities/user.entity';

@Injectable()
export class AuditLogService {
  /**
   * Constructor - Dependency Injection
   * @InjectRepository injects the TypeORM repository for AuditLogEntity
   */
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
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
      userId?: string;
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
      userId: options?.userId,
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
   * getAuditLogs - Retrieves audit logs with optional filtering and user information
   *
   * @param filters - Filter options (action, userId, uploadId, date range, etc.)
   * @param page - Page number for pagination
   * @param limit - Number of records per page
   * @returns Paginated audit logs with user information
   */
  async getAuditLogs(
    filters?: {
      action?: AuditAction;
      userId?: string;
      uploadId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    logs: (AuditLogEntity & { userEmail?: string; userName?: string })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // First, get audit logs with pagination
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log');

    // Apply filters
    if (filters?.action) {
      queryBuilder.andWhere('audit_log.action = :action', { action: filters.action });
    }

    if (filters?.userId) {
      queryBuilder.andWhere('audit_log.userId = :userId', { userId: filters.userId });
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

    // Get total count (before pagination)
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query to get audit logs
    const logs = await queryBuilder.getMany();

    // Get unique user IDs from logs
    const userIds = [...new Set(logs.map(log => log.userId).filter(Boolean))];

    // Fetch user information for all user IDs in one query
    let usersMap = new Map<string, { email: string; firstName?: string; lastName?: string }>();
    if (userIds.length > 0) {
      const users = await this.userRepository.find({
        where: { id: In(userIds) },
      });
      users.forEach(user => {
        usersMap.set(user.id, {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      });
    }

    // Map logs to include user information
    const logsWithUserInfo = logs.map(log => {
      const logWithUser: any = { ...log };
      if (log.userId) {
        const user = usersMap.get(log.userId);
        if (user) {
          logWithUser.userEmail = user.email;
          const firstName = user.firstName || '';
          const lastName = user.lastName || '';
          logWithUser.userName = firstName || lastName
            ? `${firstName} ${lastName}`.trim()
            : user.email?.split('@')[0] || 'Unknown';
        }
      }
      return logWithUser;
    });

    return {
      logs: logsWithUserInfo,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}


