import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { CsvImportService } from './csv-import.service';
import { CsvImportResponseDto } from './dto/csv-import-response.dto';

@Controller('csv-import')
export class CsvImportController {
  constructor(private readonly csvImportService: CsvImportService) {}

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

    try {
      const result = await this.csvImportService.parseCsv(file.buffer);
      return {
        success: true,
        message: 'CSV file imported successfully',
        data: result,
        totalRows: result.length,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to parse CSV: ${error.message}`,
      );
    }
  }
}

