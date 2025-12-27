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

@ApiTags('csv-import')
@Controller('csv-import')
export class CsvImportController {
  constructor(
    private readonly csvImportService: CsvImportService,
    private readonly uploadHistoryService: UploadHistoryService,
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload and parse a CSV file',
    description:
      'Uploads a CSV file, parses it, and returns the parsed data. The upload is tracked in history with a unique ID.',
  })
  @ApiConsumes('multipart/form-data')
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
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CsvImportResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.originalname.match(/\.(csv)$/)) {
      throw new BadRequestException('Only CSV files are allowed');
    }

    // Create upload record
    const uploadRecord = await this.uploadHistoryService.createUploadRecord(
      file.originalname,
      file.size,
    );

    try {
      const result = await this.csvImportService.parseCsv(file.buffer);

      // Update upload record with success and store CSV data
      await this.uploadHistoryService.updateUploadStatus(
        uploadRecord.id,
        UploadStatus.SUCCESS,
        {
          totalRows: result.length,
          message: 'CSV file imported successfully',
          csvData: result, // Store the parsed CSV data
        },
      );

      return {
        success: true,
        message: 'CSV file imported successfully',
        data: result,
        totalRows: result.length,
        uploadId: uploadRecord.id,
      };
    } catch (error) {
      // Update upload record with failure
      await this.uploadHistoryService.updateUploadStatus(
        uploadRecord.id,
        UploadStatus.FAILED,
        {
          errors: [error.message],
          message: `Failed to parse CSV: ${error.message}`,
        },
      );

      throw new BadRequestException(`Failed to parse CSV: ${error.message}`);
    }
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get upload history',
    description:
      'Retrieves all upload records. Can be filtered by status (success, failed, processing). Results are sorted with success first, then processing, then failed.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: UploadStatus,
    description: 'Filter uploads by status',
  })
  @ApiResponse({
    status: 200,
    description: 'Upload history retrieved successfully',
    type: UploadHistoryResponseDto,
  })
  async getUploadHistory(
    @Query('status') status?: UploadStatus,
  ): Promise<UploadHistoryResponseDto> {
    let uploads = await this.uploadHistoryService.getAllUploads();

    // Filter by status if provided
    if (status && Object.values(UploadStatus).includes(status)) {
      uploads = await this.uploadHistoryService.getUploadsByStatus(status);
    }

    const success = uploads.filter(
      (u) => u.status === UploadStatus.SUCCESS,
    ).length;
    const failed = uploads.filter(
      (u) => u.status === UploadStatus.FAILED,
    ).length;
    const processing = uploads.filter(
      (u) => u.status === UploadStatus.PROCESSING,
    ).length;

    return {
      uploads,
      total: uploads.length,
      success,
      failed,
      processing,
    };
  }

  @Get('history/:id')
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
    const upload = await this.uploadHistoryService.getUploadById(id);
    if (!upload) {
      throw new NotFoundException('Upload record not found');
    }
    return upload;
  }

  @Get('history/:id/data')
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
    const upload = await this.uploadHistoryService.getUploadById(id);
    if (!upload) {
      throw new NotFoundException('Upload record not found');
    }

    if (upload.status !== UploadStatus.SUCCESS) {
      throw new BadRequestException(
        'CSV data is only available for successful uploads',
      );
    }

    if (!upload.data) {
      throw new NotFoundException('CSV data not found for this upload');
    }

    return {
      uploadId: upload.id,
      fileName: upload.fileName,
      totalRows: upload.totalRows,
      data: upload.data,
    };
  }
}
