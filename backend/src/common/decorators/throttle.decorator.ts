/**
 * throttle.decorator.ts - Custom Rate Limiting Decorators
 *
 * Provides custom decorators for applying different rate limits to different endpoints.
 * This allows fine-grained control over rate limiting based on endpoint sensitivity.
 */

import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiResponse } from '@nestjs/swagger';

/**
 * Rate limit configurations for different endpoint types
 */
export const RateLimitConfig = {
  /**
   * Strict rate limit for authentication endpoints
   * Prevents brute force attacks
   * 5 requests per 15 minutes
   */
  STRICT: { limit: 5, ttl: 15 * 60 * 1000 }, // 5 requests per 15 minutes

  /**
   * Moderate rate limit for file upload endpoints
   * Prevents abuse while allowing legitimate use
   * 10 requests per minute
   */
  MODERATE: { limit: 10, ttl: 60 * 1000 }, // 10 requests per minute

  /**
   * Lenient rate limit for read-only endpoints
   * Allows more frequent access for data retrieval
   * 100 requests per minute
   */
  LENIENT: { limit: 100, ttl: 60 * 1000 }, // 100 requests per minute

  /**
   * Default rate limit for general endpoints
   * 50 requests per minute
   */
  DEFAULT: { limit: 50, ttl: 60 * 1000 }, // 50 requests per minute
};

/**
 * Apply strict rate limiting (for authentication endpoints)
 * Use this for login, register, password reset, etc.
 */
export const ThrottleStrict = () =>
  applyDecorators(
    Throttle(RateLimitConfig.STRICT.limit, RateLimitConfig.STRICT.ttl),
    ApiResponse({
      status: 429,
      description: 'Too Many Requests - Rate limit exceeded. Please try again later.',
    }),
  );

/**
 * Apply moderate rate limiting (for file upload endpoints)
 * Use this for file uploads, bulk operations, etc.
 */
export const ThrottleModerate = () =>
  applyDecorators(
    Throttle(RateLimitConfig.MODERATE.limit, RateLimitConfig.MODERATE.ttl),
    ApiResponse({
      status: 429,
      description: 'Too Many Requests - Rate limit exceeded. Please try again later.',
    }),
  );

/**
 * Apply lenient rate limiting (for read-only endpoints)
 * Use this for GET requests, data retrieval, etc.
 */
export const ThrottleLenient = () =>
  applyDecorators(
    Throttle(RateLimitConfig.LENIENT.limit, RateLimitConfig.LENIENT.ttl),
    ApiResponse({
      status: 429,
      description: 'Too Many Requests - Rate limit exceeded. Please try again later.',
    }),
  );

/**
 * Skip rate limiting for specific endpoints
 * Use this when you want to bypass rate limiting for certain routes
 */
export const SkipThrottle = () => applyDecorators();

