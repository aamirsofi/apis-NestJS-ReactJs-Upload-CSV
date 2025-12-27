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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Query,
  Param,
  NotFoundException,
} from '@nestjs/common';
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
import { CsvImportResponseDto } from './dto/csv-import-response.dto';
import { UploadHistoryResponseDto } from './dto/upload-history-response.dto';
import { UploadStatus } from './interfaces/upload-status.enum';

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
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File, // Extracts uploaded file from request
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
      // Step 2: Parse the CSV file
      // csvImportService.parseCsv() converts the file buffer into structured data
      const result = await this.csvImportService.parseCsv(file.buffer);

      // Step 3: Update upload record with SUCCESS status and store CSV data
      await this.uploadHistoryService.updateUploadStatus(
        uploadRecord.id,
        UploadStatus.SUCCESS,
        {
          totalRows: result.length,
          message: 'CSV file imported successfully',
          csvData: result, // Store the parsed CSV data in database
        },
      );

      // Step 4: Return success response with parsed data
      return {
        success: true,
        message: 'CSV file imported successfully',
        data: result,
        totalRows: result.length,
        uploadId: uploadRecord.id, // Return ID so client can track this upload
      };
    } catch (error) {
      // If parsing fails, update record with FAILED status
      await this.uploadHistoryService.updateUploadStatus(
        uploadRecord.id,
        UploadStatus.FAILED,
        {
          errors: [error.message],
          message: `Failed to parse CSV: ${error.message}`,
        },
      );

      // Throw error to return error response to client
      throw new BadRequestException(`Failed to parse CSV: ${error.message}`);
    }
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
  async getUploadData(@Param('id') id: string) {
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

    // Return CSV data with metadata
    return {
      uploadId: upload.id,
      fileName: upload.fileName,
      totalRows: upload.totalRows,
      data: upload.data, // The actual parsed CSV data
    };
  }
}
