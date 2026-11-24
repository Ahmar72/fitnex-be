import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Update User Profile DTO
 */
export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Alex Mercer',
    description: 'Updated display name',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/new-avatar.png',
    description: 'Updated avatar image URL',
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({
    example: 'ur',
    description: 'Updated preferred language code for voice guidelines and UI',
  })
  @IsString()
  @IsOptional()
  preferredLanguage?: string;
}
