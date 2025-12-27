/**
 * public.decorator.ts - Public Route Decorator
 *
 * Decorator to mark routes as public (no authentication required).
 * Used with @Public() decorator on controller methods.
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

