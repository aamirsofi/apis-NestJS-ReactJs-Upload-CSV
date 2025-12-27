import { Module } from '@nestjs/common';
import { CsvImportController } from './csv-import.controller';
import { CsvImportService } from './csv-import.service';
import { UploadHistoryService } from './services/upload-history.service';

@Module({
  controllers: [CsvImportController],
  providers: [CsvImportService, UploadHistoryService],
})
export class CsvImportModule {}
