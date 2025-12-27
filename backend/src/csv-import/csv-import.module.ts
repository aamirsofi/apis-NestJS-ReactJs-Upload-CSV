/**
 * csv-import.module.ts - CSV Import Feature Module
 *
 * This module groups all CSV import-related functionality together.
 * It registers controllers, services, and makes database repositories available.
 *
 * Module Structure:
 * - Controllers: Handle HTTP requests (csv-import.controller.ts)
 * - Services: Business logic (csv-import.service.ts, upload-history.service.ts)
 * - Entities: Database models (upload-record.entity.ts)
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CsvImportController } from './csv-import.controller';
import { CsvImportService } from './csv-import.service';
import { UploadHistoryService } from './services/upload-history.service';
import { UploadRecordEntity } from './entities/upload-record.entity';

@Module({
  // Import TypeORM feature module to make UploadRecordEntity repository available
  // This allows services in this module to use the database repository
  imports: [TypeOrmModule.forFeature([UploadRecordEntity])],

  // Controllers: Handle HTTP requests and define API endpoints
  controllers: [CsvImportController],

  // Providers: Services that contain business logic
  // These can be injected into controllers and other services
  providers: [CsvImportService, UploadHistoryService],
})
export class CsvImportModule {}
