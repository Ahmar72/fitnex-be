import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Change Password DTO
 * 
 * Requires current password verification before updating account password.
 */
export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPassword123!',
    description: 'Existing account password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  oldPassword: string;

  @ApiProperty({
    example: 'NewSecretPass456!',
    description: 'New password (minimum 6 characters)',
  })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;
}
