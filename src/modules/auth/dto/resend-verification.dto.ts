import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * Resend Email Verification DTO
 */
export class ResendVerificationDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Registered email address to resend verification code to',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;
}
