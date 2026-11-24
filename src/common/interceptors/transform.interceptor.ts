import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

/**
 * Standard Transform Interceptor
 * 
 * Intercepts successful responses and wraps them into a uniform structure:
 * {
 *   success: true,
 *   statusCode: number,
 *   message: string,
 *   data: any
 * }
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();
    const statusCode = response.statusCode || 200;

    return next.handle().pipe(
      map((result) => {
        // If response already has the structure, return as is
        if (
          result &&
          typeof result === 'object' &&
          'success' in result &&
          'statusCode' in result
        ) {
          return result;
        }

        // Support custom message in return object: { message: '...', ...data }
        let message = 'Operation completed successfully';
        let data = result;

        if (result && typeof result === 'object' && 'message' in result && 'data' in result) {
          message = result.message;
          data = result.data;
        }

        return {
          success: true,
          statusCode,
          message,
          data,
        };
      }),
    );
  }
}
