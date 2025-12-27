/**
 * current-user.decorator.ts - Current User Decorator
 *
 * Decorator to extract current authenticated user from request.
 * Used with @CurrentUser() decorator on controller methods.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

