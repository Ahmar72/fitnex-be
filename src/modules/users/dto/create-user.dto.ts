import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Create User DTO
 */
export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Unique email address of the user',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'User password (minimum 6 characters)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    example: 'Alex Mercer',
    description: 'Full name of the user',
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    example: 'https://example.com/avatar.png',
    description: 'Optional avatar URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({
    example: 'en',
    description: 'Preferred app language (e.g. en, ur, es, fr)',
    required: false,
    default: 'en',
  })
  @IsString()
  @IsOptional()
  preferredLanguage?: string;
}
