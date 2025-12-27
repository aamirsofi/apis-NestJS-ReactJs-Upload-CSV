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
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { CsvImportService } from './csv-import.service';
import { UploadHistoryService } from './services/upload-history.service';
import { CsvImportResponseDto } from './dto/csv-import-response.dto';
import { UploadHistoryResponseDto } from './dto/upload-history-response.dto';
import { UploadStatus } from './interfaces/upload-status.enum';

@Controller('csv-import')
export class CsvImportController {
  constructor(
    private readonly csvImportService: CsvImportService,
    private readonly uploadHistoryService: UploadHistoryService,
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
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
    const uploadRecord = this.uploadHistoryService.createUploadRecord(
      file.originalname,
      file.size,
    );

    try {
      const result = await this.csvImportService.parseCsv(file.buffer);
      
      // Update upload record with success
      this.uploadHistoryService.updateUploadStatus(
        uploadRecord.id,
        UploadStatus.SUCCESS,
        {
          totalRows: result.length,
          message: 'CSV file imported successfully',
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
      this.uploadHistoryService.updateUploadStatus(
        uploadRecord.id,
        UploadStatus.FAILED,
        {
          errors: [error.message],
          message: `Failed to parse CSV: ${error.message}`,
        },
      );

      throw new BadRequestException(
        `Failed to parse CSV: ${error.message}`,
      );
    }
  }

  @Get('history')
  async getUploadHistory(
    @Query('status') status?: UploadStatus,
  ): Promise<UploadHistoryResponseDto> {
    let uploads = this.uploadHistoryService.getAllUploads();

    // Filter by status if provided
    if (status && Object.values(UploadStatus).includes(status)) {
      uploads = this.uploadHistoryService.getUploadsByStatus(status);
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
  async getUploadById(@Param('id') id: string) {
    const upload = this.uploadHistoryService.getUploadById(id);
    if (!upload) {
      throw new NotFoundException('Upload record not found');
    }
    return upload;
  }
}

