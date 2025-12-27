/**
 * main.ts - Application Entry Point
 *
 * This is the starting point of the NestJS application.
 * It bootstraps (starts) the application and configures global settings.
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Bootstrap Function
 * This function starts the NestJS application
 */
async function bootstrap() {
  // Create the NestJS application instance using AppModule
  // AppModule is the root module that contains all other modules
  const app = await NestFactory.create(AppModule);

  // Enable trust proxy for correct IP detection behind reverse proxies/load balancers
  // This is important for rate limiting to work correctly in production
  app.set('trust proxy', true);

  // Enable CORS (Cross-Origin Resource Sharing)
  // This allows the frontend (running on different port) to make requests to this API
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true, // Allow credentials (cookies, authorization headers)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global Validation Pipe
  // Automatically validates incoming data based on DTOs (Data Transfer Objects)
  // - whitelist: Strips out properties that don't have decorators
  // - forbidNonWhitelisted: Throws error if extra properties are sent
  // - transform: Automatically transforms payloads to DTO instances
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger/OpenAPI Documentation Setup
  // Creates interactive API documentation that developers can use to test endpoints
  const config = new DocumentBuilder()
    .setTitle('CSV Import API')
    .setDescription(
      'A REST API for uploading, parsing, and managing CSV files. Provides endpoints for file upload, history tracking, and data retrieval.\n\n' +
      '**Rate Limiting:**\n' +
      '- Authentication endpoints: 5 requests per 15 minutes\n' +
      '- File upload endpoints: 10 requests per minute\n' +
      '- Read-only endpoints: 100 requests per minute\n' +
      '- Default: 50 requests per minute\n\n' +
      'Rate limit headers are included in all responses:\n' +
      '- `X-RateLimit-Limit`: Maximum number of requests allowed\n' +
      '- `X-RateLimit-Remaining`: Number of requests remaining\n' +
      '- `X-RateLimit-Reset`: Time when the rate limit resets\n' +
      '- `Retry-After`: Seconds to wait before retrying (when limit exceeded)',
    )
    .setVersion('1.0')
    .addTag('csv-import', 'CSV file import and management endpoints')
    .addTag('auth', 'Authentication endpoints')
    .addTag('health', 'Health check endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .build();

  // Generate Swagger documentation from the application
  const document = SwaggerModule.createDocument(app, config);
  // Setup Swagger UI at /api-docs endpoint
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'CSV Import API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  // Get port from environment variable or use default 3000
  const port = process.env.PORT || 3000;
  // Start listening for incoming HTTP requests
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger API Documentation: http://localhost:${port}/api-docs`);
}

// Call bootstrap to start the application
bootstrap();
