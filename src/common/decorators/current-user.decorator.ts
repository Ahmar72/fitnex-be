import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom parameter decorator to extract the currently authenticated user from the request.
 * 
 * @example
 * @Get('me')
 * getProfile(@CurrentUser() user: UserDocument) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Return specific property if requested (e.g., @CurrentUser('id'))
    if (data && user) {
      return user[data];
    }

    return user;
  },
);
