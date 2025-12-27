/**
 * auth.module.ts - Authentication Module
 *
 * This module groups all authentication-related functionality together.
 * It registers controllers, services, and makes database repositories available.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserEntity } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    // Import TypeORM feature module to make UserEntity repository available
    TypeOrmModule.forFeature([UserEntity]),

    // PassportModule - Required for authentication strategies
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JwtModule - Configure JWT token generation and validation
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule], // Export AuthService for use in other modules
})
export class AuthModule {}

