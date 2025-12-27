/**
 * throttler-behind-proxy.guard.ts - Custom Throttler Guard for Proxy Support
 *
 * Extends the default ThrottlerGuard to properly handle IP addresses when behind a proxy.
 * This ensures rate limiting works correctly in production environments with load balancers or reverse proxies.
 */

import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  /**
   * Override getTracker to get IP from X-Forwarded-For header when behind a proxy
   * This ensures rate limiting works correctly when the application is behind a reverse proxy or load balancer
   */
  protected getTracker(req: Request): string {
    // Get IP from X-Forwarded-For header if behind a proxy, otherwise use direct IP
    // X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2), so we take the first one
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    if (forwardedFor) {
      return forwardedFor.split(',')[0]?.trim() || 'unknown';
    }

    // Fallback to req.ip (set by Express trust proxy) or socket address
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}

