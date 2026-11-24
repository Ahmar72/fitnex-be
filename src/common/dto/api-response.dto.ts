import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard API Success Response Wrapper
 * Ensures all successful responses adhere to a consistent JSON structure.
 */
export class ApiResponseDto<T> {
  @ApiProperty({
    example: true,
    description: 'Indicates whether the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 200,
    description: 'HTTP status code of the response',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Operation completed successfully',
    description: 'Human-readable response message',
  })
  message: string;

  @ApiProperty({
    description: 'Response payload data',
    required: false,
  })
  data?: T;

  constructor(statusCode: number, message: string, data?: T) {
    this.success = true;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

/**
 * Standard API Error Response Model
 * Used for Swagger documentation of error responses.
 */
export class ApiErrorResponseDto {
  @ApiProperty({
    example: false,
    description: 'Always false for error responses',
  })
  success: boolean;

  @ApiProperty({
    example: 400,
    description: 'HTTP status code of the error',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Validation failed or resource not found',
    description: 'Error message explaining the failure',
  })
  message: string;

  @ApiProperty({
    example: 'Bad Request',
    description: 'Error name or category',
  })
  error: string;

  @ApiProperty({
    example: '2026-11-24T12:00:00.000Z',
    description: 'ISO timestamp when the error occurred',
  })
  timestamp: string;

  @ApiProperty({
    example: '/api/v1/auth/login',
    description: 'API endpoint where the error occurred',
  })
  path: string;
}
