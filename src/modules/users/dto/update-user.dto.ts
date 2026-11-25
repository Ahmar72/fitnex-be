import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Update User Profile & Settings DTO
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
    example: 'en',
    description: 'Updated preferred language code for voice guidelines and UI',
  })
  @IsString()
  @IsOptional()
  preferredLanguage?: string;

  @ApiPropertyOptional({
    example: 'kg',
    enum: ['kg', 'lbs'],
    description: 'Preferred weight unit',
  })
  @IsOptional()
  @IsIn(['kg', 'lbs'])
  weightUnit?: string;

  @ApiPropertyOptional({
    example: 'cm',
    enum: ['cm', 'ft'],
    description: 'Preferred height unit',
  })
  @IsOptional()
  @IsIn(['cm', 'ft'])
  heightUnit?: string;

  @ApiPropertyOptional({
    example: 'dark',
    enum: ['system', 'light', 'dark'],
    description: 'Preferred application theme',
  })
  @IsOptional()
  @IsIn(['system', 'light', 'dark'])
  theme?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Enable or disable speech synthesis voice overview guidelines',
  })
  @IsOptional()
  @IsBoolean()
  voiceGuidelines?: boolean;

  @ApiPropertyOptional({
    example: 60,
    description: 'Default rest timer interval in seconds',
  })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(300)
  restTimerSeconds?: number;

  @ApiPropertyOptional({
    description: 'User onboarding training & metabolic goal profile data',
  })
  @IsOptional()
  @IsObject()
  profile?: Record<string, any>;
}
