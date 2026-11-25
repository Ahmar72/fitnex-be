import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Login Request DTO
 */
export class LoginDto {
  @ApiProperty({
    example: 'athlete@fitnex.com',
    description: 'Registered email address (seed default: athlete@fitnex.com)',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Account password (seed default: Password123!)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
