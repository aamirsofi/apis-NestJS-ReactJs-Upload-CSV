/**
 * auth-response.dto.ts - Authentication Response DTO
 *
 * Data Transfer Object for authentication responses.
 * Returns user information and JWT token.
 */

import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'User information',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
  })
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

