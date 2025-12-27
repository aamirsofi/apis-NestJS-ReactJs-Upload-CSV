/**
 * csv-import.controller.ts - CSV Import Controller
 *
 * This controller handles all HTTP requests related to CSV file operations.
 * It acts as the "receptionist" - receives requests, delegates work to services, and returns responses.
 *
 * Responsibilities:
 * - Handle file uploads (POST /csv-import/upload)
 * - Retrieve upload history (GET /csv-import/history)
 * - Get specific upload details (GET /csv-import/history/:id)
 * - Get CSV data for successful uploads (GET /csv-import/history/:id/data)
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Query,
  Param,
  NotFoundException,
  Body,
  Res,
  Req,
} from '@nestjs/common';
import { Response, Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { CsvImportService } from './csv-import.service';
import { UploadHistoryService } from './services/upload-history.service';
import { AuditLogService } from './services/audit-log.service';
import { AuditAction } from './entities/audit-log.entity';
import { CsvImportResponseDto } from './dto/csv-import-response.dto';
import { UploadHistoryResponseDto } from './dto/upload-history-response.dto';
import { UploadStatus } from './interfaces/upload-status.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('csv-import') // Groups endpoints in Swagger docs
@Controller('csv-import') // Base route: all endpoints start with /csv-import
export class CsvImportController {
  /**
   * Dependency Injection
   * NestJS automatically provides these services when the controller is created
   * - csvImportService: Handles CSV parsing logic
   * - uploadHistoryService: Manages upload records in database
   */
  constructor(
    private readonly csvImportService: CsvImportService,
    private readonly uploadHistoryService: UploadHistoryService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * POST /csv-import/upload
   * Uploads and parses a CSV file
   *
   * Flow:
   * 1. Receives uploaded file
   * 2. Validates file type (must be .csv)
   * 3. Creates upload record in database (status: PROCESSING)
   * 4. Parses CSV file
   * 5. Updates record with success/failure status
   * 6. Returns parsed data or error
   */
  @Post('upload') // Handles POST requests to /csv-import/upload
  @HttpCode(HttpStatus.OK) // Returns 200 status code (default for POST is 201)
  @UseInterceptors(FileInterceptor('file')) // Intercepts file upload, extracts file from 'file' field
  @ApiOperation({
    summary: 'Upload and parse a CSV file',
    description:
      'Uploads a CSV file, parses it, and returns the parsed data. The upload is tracked in history with a unique ID.',
  })
  @ApiConsumes('multipart/form-data') // Swagger: expects multipart form data
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file to upload',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file successfully parsed',
    type: CsvImportResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file or parsing error',
  })
  @ApiQuery({
    name: 'detectDuplicates',
    required: false,
    type: Boolean,
    description: 'Enable duplicate detection',
  })
  @ApiQuery({
    name: 'duplicateColumns',
    required: false,
    type: String,
    description: 'Comma-separated list of column names to check for duplicates (if empty, checks all columns)',
  })
  @ApiQuery({
    name: 'handleDuplicates',
    required: false,
    enum: ['skip', 'keep', 'mark'],
    description: 'How to handle duplicates: skip (remove duplicates), keep (keep all), mark (keep all but mark in warnings)',
  })
  @ApiQuery({
    name: 'columnMapping',
    required: false,
    type: String,
    description: 'JSON string mapping source column names to target column names (e.g., {"oldName": "newName"})',
  })
  @UseGuards(JwtAuthGuard)
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File, // Extracts uploaded file from request
    @Query('detectDuplicates') detectDuplicates?: string,
    @Query('duplicateColumns') duplicateColumns?: string,
    @Query('handleDuplicates') handleDuplicates?: 'skip' | 'keep' | 'mark',
    @Query('columnMapping') columnMappingStr?: string,
    @CurrentUser() user?: any,
    @Req() req?: ExpressRequest,
  ): Promise<CsvImportResponseDto> {
    // Validation: Check if file was uploaded
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validation: Check if file is CSV format
    if (!file.originalname.match(/\.(csv)$/)) {
      throw new BadRequestException('Only CSV files are allowed');
    }

    // Step 1: Create upload record in database with PROCESSING status
    // This tracks the upload even if parsing fails
    const uploadRecord = await this.uploadHistoryService.createUploadRecord(
      file.originalname,
      file.size,
    );

    try {
      // Step 2: Parse the CSV file with duplicate detection and column mapping options
      // csvImportService.parseCsv() converts the file buffer into structured data
      const columnsToCheck = duplicateColumns
        ? duplicateColumns.split(',').map((col) => col.trim()).filter((col) => col.length > 0)
        : undefined;

      // Parse column mapping JSON string
      let columnMapping: Record<string, string> | undefined;
      if (columnMappingStr) {
        try {
          columnMapping = JSON.parse(columnMappingStr);
        } catch (error) {
          throw new BadRequestException('Invalid column mapping JSON format');
        }
      }

      const result = await this.csvImportService.parseCsv(file.buffer, {
        detectDuplicates: detectDuplicates === 'true',
        duplicateColumns: columnsToCheck,
        handleDuplicates: handleDuplicates || 'mark',
        columnMapping,
      });

      // Step 3: Store original file buffer for download later
      await this.uploadHistoryService.storeOriginalFile(
        uploadRecord.id,
        file.buffer,
      );

      // Step 4: Prepare error messages with row numbers
      const errorMessages = result.errors.length > 0
        ? result.errors.map((err) => `Row ${err.row}: ${err.message}`)
        : [];

      // Step 5: Update upload record with SUCCESS status and store CSV data
      await this.uploadHistoryService.updateUploadStatus(
        uploadRecord.id,
        UploadStatus.SUCCESS,
        {
          totalRows: result.data.length,
          message: result.errors.length > 0
            ? `CSV file imported with ${result.errors.length} warning(s)`
            : 'CSV file imported successfully',
          csvData: result.data, // Store the parsed CSV data in database
          errors: errorMessages.length > 0 ? errorMessages : undefined,
        },
      );

      // Step 6: Prepare duplicate information
      const duplicateCount = result.duplicates?.length || 0;
      let finalMessage = result.errors.length > 0
        ? `CSV file imported with ${result.errors.length} warning(s)`
        : 'CSV file imported successfully';

      if (duplicateCount > 0) {
        finalMessage += ` (${duplicateCount} duplicate${duplicateCount !== 1 ? 's' : ''} detected)`;
      }

      // Step 7: Log successful upload action
      await this.auditLogService.logAction(AuditAction.UPLOAD, {
        userId: user?.id,
        uploadId: uploadRecord.id,
        fileName: file.originalname,
        userIp: req?.ip || req?.socket?.remoteAddress,
        userAgent: req?.headers['user-agent'],
        details: {
          fileSize: file.size,
          totalRows: result.data.length,
          duplicateCount,
          detectDuplicates: detectDuplicates === 'true',
          handleDuplicates: handleDuplicates || 'mark',
          columnMapping: columnMapping ? Object.keys(columnMapping).length : 0,
        },
        status: 'success',
      });

      // Step 8: Return success response with parsed data
      return {
        success: true,
        message: finalMessage,
        data: result.data,
        totalRows: result.data.length,
        uploadId: uploadRecord.id, // Return ID so client can track this upload
        warnings: result.errors.length > 0 ? result.errors : undefined,
        duplicates: result.duplicates,
        duplicateCount,
      };
    } catch (error) {
      // If parsing fails, update record with FAILED status
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.uploadHistoryService.updateUploadStatus(
        uploadRecord.id,
        UploadStatus.FAILED,
        {
          errors: [errorMessage],
          message: `Failed to parse CSV: ${errorMessage}`,
        },
      );

      // Log failed upload action
      await this.auditLogService.logAction(AuditAction.UPLOAD, {
        userId: user?.id,
        uploadId: uploadRecord.id,
        fileName: file.originalname,
        userIp: req?.ip || req?.socket?.remoteAddress,
        userAgent: req?.headers['user-agent'],
        status: 'failed',
        errorMessage,
      });

      // Throw error to return error response to client
      throw new BadRequestException(`Failed to parse CSV: ${errorMessage}`);
    }
  }

  /**
   * GET /csv-import/audit-logs
   * Retrieves audit logs with optional filtering
   * 
   * Note: This route must be defined before 'history/:id' to avoid route conflicts
   */
  @Get('audit-logs')
  @ApiOperation({
    summary: 'Get audit logs',
    description: 'Retrieves audit logs with optional filtering by action, upload ID, and date range.',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: AuditAction,
    description: 'Filter by action type',
  })
  @ApiQuery({
    name: 'uploadId',
    required: false,
    type: String,
    description: 'Filter by upload ID',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for filtering (ISO 8601 format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for filtering (ISO 8601 format)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records per page (default: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  @UseGuards(JwtAuthGuard)
  async getAuditLogs(
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('uploadId') uploadId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: {
      action?: AuditAction;
      userId?: string;
      uploadId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {};

    if (action && Object.values(AuditAction).includes(action as AuditAction)) {
      filters.action = action as AuditAction;
    }

    if (userId) {
      filters.userId = userId;
    }

    if (uploadId) {
      filters.uploadId = uploadId;
    }

    if (startDate) {
      filters.startDate = new Date(startDate);
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filters.endDate = endDateTime;
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;

    return await this.auditLogService.getAuditLogs(filters, pageNum, limitNum);
  }

  /**
   * GET /csv-import/history
   * Retrieves upload history with advanced filtering options
   *
   * Query Parameters:
   * - status (optional): Filter by 'success', 'failed', or 'processing'
   * - search (optional): Search by filename (case-insensitive partial match)
   * - startDate (optional): Filter uploads from this date (ISO 8601 format)
   * - endDate (optional): Filter uploads until this date (ISO 8601 format)
   * - minSize (optional): Minimum file size in bytes
   * - maxSize (optional): Maximum file size in bytes
   *
   * Returns:
   * - List of all uploads (or filtered by criteria)
   * - Statistics: total, success count, failed count, processing count
   * - Results sorted: success first, then processing, then failed
   */
  @UseGuards(JwtAuthGuard)
  @Get('history') // Handles GET requests to /csv-import/history
  @ApiOperation({
    summary: 'Get upload history with advanced filters',
    description:
      'Retrieves all upload records with optional filtering by status, filename search, date range, and file size. Results are sorted with success first, then processing, then failed.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: UploadStatus,
    description: 'Filter uploads by status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by filename (case-insensitive partial match)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter uploads from this date (ISO 8601 format, e.g., 2024-01-01T00:00:00Z)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter uploads until this date (ISO 8601 format, e.g., 2024-12-31T23:59:59Z)',
  })
  @ApiQuery({
    name: 'minSize',
    required: false,
    type: Number,
    description: 'Minimum file size in bytes',
  })
  @ApiQuery({
    name: 'maxSize',
    required: false,
    type: Number,
    description: 'Maximum file size in bytes',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Upload history retrieved successfully',
    type: UploadHistoryResponseDto,
  })
  async getUploadHistory(
    @Query('status') status?: UploadStatus,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('minSize') minSize?: string,
    @Query('maxSize') maxSize?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<UploadHistoryResponseDto> {
    // Parse pagination parameters
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit
      ? Math.min(100, Math.max(1, parseInt(limit, 10)))
      : 10;

    // Get all uploads for statistics (without pagination)
    const allUploads = await this.uploadHistoryService.getAllUploads();

    // Calculate total statistics from all uploads
    const totalSuccess = allUploads.filter(
      (u) => u.status === UploadStatus.SUCCESS,
    ).length;
    const totalFailed = allUploads.filter(
      (u) => u.status === UploadStatus.FAILED,
    ).length;
    const totalProcessing = allUploads.filter(
      (u) => u.status === UploadStatus.PROCESSING,
    ).length;

    // Get filtered and paginated uploads
    const result = await this.uploadHistoryService.getUploadsWithFilters(
      {
        status,
        search,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        minSize: minSize ? parseInt(minSize, 10) : undefined,
        maxSize: maxSize ? parseInt(maxSize, 10) : undefined,
      },
      pageNum,
      limitNum,
    );

    // Return paginated uploads with statistics
    return {
      uploads: result.records,
      total: result.total,
      success: totalSuccess,
      failed: totalFailed,
      processing: totalProcessing,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNextPage: result.page < result.totalPages,
      hasPreviousPage: result.page > 1,
    };
  }

  /**
   * GET /csv-import/history/:id
   * Gets detailed information about a specific upload record
   *
   * Path Parameter:
   * - id: The unique ID of the upload record
   *
   * Returns:
   * - Upload record details (filename, status, dates, errors, etc.)
   * - Does NOT include CSV data (use /history/:id/data for that)
   */
  @UseGuards(JwtAuthGuard)
  @Get('history/:id') // Handles GET requests to /csv-import/history/:id
  @ApiOperation({
    summary: 'Get upload details by ID',
    description:
      'Retrieves detailed information about a specific upload record.',
  })
  @ApiParam({
    name: 'id',
    description: 'Upload record ID',
    example: '1234567890-abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Upload record retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Upload record not found',
  })
  async getUploadById(@Param('id') id: string) {
    // Find upload record by ID in database
    const upload = await this.uploadHistoryService.getUploadById(id);
    if (!upload) {
      throw new NotFoundException('Upload record not found');
    }
    return upload;
  }

  /**
   * GET /csv-import/history/:id/data
   * Gets the parsed CSV data for a successful upload
   *
   * Path Parameter:
   * - id: The unique ID of the upload record
   *
   * Requirements:
   * - Upload must have status 'success'
   * - CSV data must exist in the record
   *
   * Returns:
   * - The actual CSV data that was parsed and stored
   * - Useful for viewing what was imported
   */
  @Get('history/:id/data') // Handles GET requests to /csv-import/history/:id/data
  @ApiOperation({
    summary: 'Get CSV data for a successful upload',
    description:
      'Retrieves the parsed CSV data for a successful upload. Only available for uploads with status "success".',
  })
  @ApiParam({
    name: 'id',
    description: 'Upload record ID',
    example: '1234567890-abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV data retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'CSV data only available for successful uploads',
  })
  @ApiResponse({
    status: 404,
    description: 'Upload record or CSV data not found',
  })
  @UseGuards(JwtAuthGuard)
  async getUploadData(@Param('id') id: string, @CurrentUser() user?: any, @Req() req?: ExpressRequest) {
    // Get upload record from database
    const upload = await this.uploadHistoryService.getUploadById(id);
    if (!upload) {
      throw new NotFoundException('Upload record not found');
    }

    // Validation: Only successful uploads have CSV data
    if (upload.status !== UploadStatus.SUCCESS) {
      throw new BadRequestException(
        'CSV data is only available for successful uploads',
      );
    }

    // Validation: Check if CSV data exists
    if (!upload.data) {
      throw new NotFoundException('CSV data not found for this upload');
    }

    // Log view data action
    await this.auditLogService.logAction(AuditAction.VIEW_DATA, {
      userId: user?.id,
      uploadId: upload.id,
      fileName: upload.fileName,
      userIp: req?.ip || req?.socket?.remoteAddress,
      userAgent: req?.headers['user-agent'],
      details: {
        totalRows: upload.totalRows,
      },
      status: 'success',
    });

    // Return CSV data with metadata
    return {
      uploadId: upload.id,
      fileName: upload.fileName,
      totalRows: upload.totalRows,
      data: upload.data, // The actual parsed CSV data
    };
  }

  /**
   * GET /csv-import/history/:id/download
   * Downloads the original CSV file
   */
  @Get('history/:id/download')
  @ApiOperation({
    summary: 'Download original CSV file',
    description: 'Downloads the original CSV file that was uploaded.',
  })
  @ApiParam({ name: 'id', description: 'Upload record ID' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Upload record or file not found' })
  @UseGuards(JwtAuthGuard)
  async downloadOriginalFile(@Param('id') id: string, @Res() res: Response, @CurrentUser() user?: any, @Req() req?: ExpressRequest) {
    const upload = await this.uploadHistoryService.getUploadById(id);
    if (!upload) {
      throw new NotFoundException('Upload record not found');
    }

    const fileBuffer = await this.uploadHistoryService.getOriginalFile(id);
    if (!fileBuffer) {
      throw new NotFoundException('Original file not found');
    }

    // Log download action
    await this.auditLogService.logAction(AuditAction.DOWNLOAD_ORIGINAL, {
      userId: user?.id,
      uploadId: upload.id,
      fileName: upload.fileName,
      userIp: req?.ip || req?.socket?.remoteAddress,
      userAgent: req?.headers['user-agent'],
      details: {
        fileSize: upload.fileSize,
      },
      status: 'success',
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${upload.fileName}"`,
    );
    res.send(fileBuffer);
  }

  /**
   * POST /csv-import/history/export
   * Exports CSV data to a downloadable CSV file
   */
  @Post('history/export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export CSV data',
    description: 'Exports CSV data from an upload to a downloadable CSV file.',
  })
  @ApiResponse({ status: 200, description: 'CSV file exported successfully' })
  @UseGuards(JwtAuthGuard)
  async exportCsvData(@Body('uploadId') uploadId: string, @Res() res: Response, @CurrentUser() user?: any, @Req() req?: ExpressRequest) {
    const upload = await this.uploadHistoryService.getUploadById(uploadId);
    if (!upload) {
      throw new NotFoundException('Upload record not found');
    }

    if (upload.status !== UploadStatus.SUCCESS || !upload.data) {
      throw new BadRequestException('CSV data is only available for successful uploads');
    }

    // Convert data to CSV format
    const headers = upload.data.length > 0 ? Object.keys(upload.data[0]) : [];
    const csvRows = [
      headers.join(','), // Header row
      ...upload.data.map((row) =>
        headers.map((header) => {
          const value = row[header] || '';
          // Escape commas and quotes in CSV
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(','),
      ),
    ];

    const csvContent = csvRows.join('\n');
    const csvBuffer = Buffer.from(csvContent, 'utf-8');

    // Log export action
    await this.auditLogService.logAction(AuditAction.EXPORT, {
      userId: user?.id,
      uploadId: upload.id,
      fileName: upload.fileName,
      userIp: req?.ip || req?.socket?.remoteAddress,
      userAgent: req?.headers['user-agent'],
      details: {
        totalRows: upload.totalRows,
        exportFileName: `export_${upload.fileName}`,
      },
      status: 'success',
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="export_${upload.fileName}"`,
    );
    res.send(csvBuffer);
  }

  /**
   * DELETE /csv-import/history/bulk
   * Deletes multiple upload records
   */
  @Delete('history/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk delete uploads',
    description: 'Deletes multiple upload records by their IDs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Uploads deleted successfully',
  })
  @UseGuards(JwtAuthGuard)
  async bulkDelete(@Body('ids') ids: string[], @CurrentUser() user?: any, @Req() req?: ExpressRequest) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('ids array is required and must not be empty');
    }

    const deletedCount = await this.uploadHistoryService.deleteUploads(ids);

    // Log bulk delete action
    await this.auditLogService.logAction(AuditAction.BULK_DELETE, {
      userId: user?.id,
      userIp: req?.ip || req?.socket?.remoteAddress,
      userAgent: req?.headers['user-agent'],
      details: {
        deletedCount,
        uploadIds: ids,
      },
      status: 'success',
    });

    return {
      deleted: deletedCount,
      message: `Successfully deleted ${deletedCount} upload(s)`,
    };
  }

}
