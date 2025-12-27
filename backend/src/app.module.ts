/**
 * app.module.ts - Root Module
 *
 * This is the main module that ties everything together.
 * It imports all other modules and configures global services like database connection.
 *
 * Think of this as the "main hub" that connects all parts of the application.
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CsvImportModule } from './csv-import/csv-import.module';
import { AuthModule } from './auth/auth.module';
import { UploadRecordEntity } from './csv-import/entities/upload-record.entity';
import { AuditLogEntity } from './csv-import/entities/audit-log.entity';
import { UserEntity } from './auth/entities/user.entity';

@Module({
  imports: [
    // ConfigModule - Manages environment variables (.env file)
    // isGlobal: true means all modules can access ConfigService without importing ConfigModule
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // TypeOrmModule - Database connection configuration
    // forRootAsync: Configures the database connection asynchronously
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Need ConfigModule to read .env variables
      useFactory: (configService: ConfigService) => ({
        type: 'postgres', // Database type: PostgreSQL
        host: configService.get('DB_HOST', 'localhost'), // Database host
        port: configService.get('DB_PORT', 5432), // Database port
        username: configService.get('DB_USERNAME', 'postgres'), // Database username
        password: configService.get('DB_PASSWORD', 'postgres'), // Database password
        database: configService.get('DB_NAME', 'csv_import'), // Database name
        entities: [UploadRecordEntity, AuditLogEntity, UserEntity], // Database entities (tables) to use
        synchronize: configService.get('NODE_ENV') !== 'production', // Auto-create/update tables in dev mode
        logging: configService.get('NODE_ENV') === 'development', // Log SQL queries in dev mode
      }),
      inject: [ConfigService], // Inject ConfigService to read environment variables
    }),

    // TypeOrmModule.forFeature - Makes entities repository available in other modules
    TypeOrmModule.forFeature([UploadRecordEntity, AuditLogEntity, UserEntity]),

    // AuthModule - Authentication and user management
    AuthModule,

    // CsvImportModule - Our custom module for CSV import functionality
    CsvImportModule,

    // ThrottlerModule - Rate limiting configuration
    // Prevents API abuse by limiting the number of requests per time window
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          // Default rate limit: 100 requests per 60 seconds (1 minute)
          ttl: configService.get<number>('THROTTLE_TTL', 60000), // Time window in milliseconds
          limit: configService.get<number>('THROTTLE_LIMIT', 100), // Max requests per window
        },
      ],
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController], // Controllers that handle HTTP requests
  providers: [
    AppService, // Services that contain business logic
    // Apply ThrottlerGuard globally to all routes with rate limit headers
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
  ],
})
export class AppModule {}
