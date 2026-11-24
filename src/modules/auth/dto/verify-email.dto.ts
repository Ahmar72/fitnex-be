import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Verify Email Request DTO
 */
export class VerifyEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address being verified',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  @ApiProperty({
    example: '482910',
    description: '6-digit verification code received via email',
  })
  @IsString()
  @IsNotEmpty({ message: 'Verification code is required' })
  token: string;
}
