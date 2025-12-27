import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CsvImportController } from './csv-import.controller';
import { CsvImportService } from './csv-import.service';
import { UploadHistoryService } from './services/upload-history.service';
import { UploadRecordEntity } from './entities/upload-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UploadRecordEntity])],
  controllers: [CsvImportController],
  providers: [CsvImportService, UploadHistoryService],
})
export class CsvImportModule {}
