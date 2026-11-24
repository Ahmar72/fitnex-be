import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Reset Password Request DTO
 */
export class ResetPasswordDto {
  @ApiProperty({
    example: '789234',
    description: 'Password reset token received via email',
  })
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token: string;

  @ApiProperty({
    example: 'NewSecurePass123!',
    description: 'New password (minimum 6 characters)',
  })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;
}
