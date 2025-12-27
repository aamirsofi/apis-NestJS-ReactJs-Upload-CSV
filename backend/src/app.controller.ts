/**
 * app.controller.ts - Root Controller
 *
 * This controller handles basic root-level HTTP endpoints.
 * It's separate from the CSV import functionality and provides general API information.
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health') // Groups this controller in Swagger documentation under "health" tag
@Controller() // No base route, so endpoints are at root level (/)
export class AppController {
  // Dependency Injection: AppService is automatically provided by NestJS
  constructor(private readonly appService: AppService) {}

  /**
   * GET / - Welcome endpoint
   * Returns a welcome message when someone visits the root URL
   */
  @Get() // Handles GET requests to /
  @ApiOperation({ summary: 'Welcome message' }) // Swagger documentation
  @ApiResponse({ status: 200, description: 'Welcome message' })
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * GET /health - Health check endpoint
   * Used to verify that the API is running and responding
   * Commonly used by monitoring tools and load balancers
   */
  @Get('health') // Handles GET requests to /health
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the health status of the API',
  })
  @ApiResponse({
    status: 200,
    description: 'API is running',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        message: { type: 'string', example: 'CSV Import API is running' },
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      message: 'CSV Import API is running',
    };
  }
}
