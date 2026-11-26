import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Change Password DTO
 * 
 * Requires current password verification before updating account password.
 */
export class ChangePasswordDto {
  @ApiPropertyOptional({
    example: 'OldPassword123!',
    description: 'Existing account password',
  })
  @IsOptional()
  @IsString()
  oldPassword?: string;

  @ApiPropertyOptional({
    example: 'OldPassword123!',
    description: 'Existing account password (alias)',
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({
    example: 'NewSecretPass456!',
    description: 'New password (minimum 6 characters)',
  })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;
}
