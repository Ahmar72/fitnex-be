import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for marking public routes
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Custom decorator to mark endpoints as publicly accessible without JWT authentication.
 * 
 * @example
 * @Public()
 * @Get('health')
 * getHealth() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
