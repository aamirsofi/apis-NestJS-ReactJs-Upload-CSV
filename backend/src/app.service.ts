/**
 * app.service.ts - Root Service
 *
 * This service contains basic business logic for the root controller.
 * Currently just provides a welcome message.
 */

import { Injectable } from '@nestjs/common';

@Injectable() // Makes this class available for dependency injection
export class AppService {
  /**
   * Returns a welcome message
   * Used by the root controller's getHello() method
   */
  getHello(): string {
    return 'Welcome to CSV Import API!';
  }
}
