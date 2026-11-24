import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CalculateCaloriesDto } from './calculate-calories.dto';

export enum FitnessGoalEnum {
  MUSCLE = 'muscle',
  FAT = 'fat',
  STRENGTH = 'strength',
  FIT = 'fit',
}

export enum ExperienceLevelEnum {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

/**
 * Save Onboarding Profile DTO
 * Extends caloric stats with fitness program preferences.
 */
export class SaveOnboardingDto extends CalculateCaloriesDto {
  @ApiProperty({
    enum: FitnessGoalEnum,
    example: FitnessGoalEnum.MUSCLE,
    description: 'Primary fitness objective',
  })
  @IsEnum(FitnessGoalEnum)
  goal: FitnessGoalEnum;

  @ApiProperty({
    enum: ExperienceLevelEnum,
    example: ExperienceLevelEnum.BEGINNER,
    description: 'Training experience level',
  })
  @IsEnum(ExperienceLevelEnum)
  level: ExperienceLevelEnum;

  @ApiProperty({
    example: 3,
    description: 'Target training days per week',
    minimum: 1,
    maximum: 7,
  })
  @IsInt()
  @Min(1)
  @Max(7)
  daysPerWeek: number;

  @ApiPropertyOptional({
    example: 'muscle-building',
    description: 'Assigned starter plan identifier',
  })
  @IsOptional()
  @IsString()
  planId?: string;
}
