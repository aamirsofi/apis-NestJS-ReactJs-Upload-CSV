/**
 * login.dto.ts - Login Request DTO
 *
 * Data Transfer Object for user login requests.
 * Validates incoming login credentials.
 */

import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
  })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}

