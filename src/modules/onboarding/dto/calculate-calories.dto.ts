import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export enum SexEnum {
  MALE = 'male',
  FEMALE = 'female',
}

export enum ActivityLevelEnum {
  SEDENTARY = 'sedentary',
  LIGHT = 'light',
  MODERATE = 'moderate',
  VERY_ACTIVE = 'very_active',
  EXTRA_ACTIVE = 'extra_active',
}

export enum WeightUnitEnum {
  KG = 'kg',
  LBS = 'lbs',
}

export enum HeightUnitEnum {
  CM = 'cm',
  FT = 'ft',
}

export enum DietGoalEnum {
  LOSS = 'loss',
  MAINTAIN = 'maintain',
  GAIN = 'gain',
}

/**
 * Calculate Calories DTO
 * Input payload for Mifflin-St Jeor metabolic calculation.
 */
export class CalculateCaloriesDto {
  @ApiProperty({ example: 25, description: 'Age in years', minimum: 10, maximum: 120 })
  @IsInt()
  @Min(10)
  @Max(120)
  age: number;

  @ApiProperty({ enum: SexEnum, example: SexEnum.MALE, description: 'Biological sex' })
  @IsEnum(SexEnum)
  sex: SexEnum;

  @ApiProperty({ example: 70, description: 'Weight in selected weightUnit' })
  @IsNumber()
  @Min(20)
  @Max(500)
  weight: number;

  @ApiProperty({ enum: WeightUnitEnum, example: WeightUnitEnum.KG, description: 'Weight unit (kg or lbs)' })
  @IsEnum(WeightUnitEnum)
  weightUnit: WeightUnitEnum;

  @ApiProperty({ example: 170, description: 'Height value (cm if cm, or total inches/raw if ft)' })
  @IsNumber()
  @Min(50)
  @Max(300)
  height: number;

  @ApiProperty({ enum: HeightUnitEnum, example: HeightUnitEnum.CM, description: 'Height unit (cm or ft)' })
  @IsEnum(HeightUnitEnum)
  heightUnit: HeightUnitEnum;

  @ApiPropertyOptional({ example: 5, description: 'Feet part when heightUnit is ft' })
  @IsOptional()
  @IsInt()
  heightFeet?: number;

  @ApiPropertyOptional({ example: 7, description: 'Inches part when heightUnit is ft' })
  @IsOptional()
  @IsInt()
  heightInches?: number;

  @ApiProperty({
    enum: ActivityLevelEnum,
    example: ActivityLevelEnum.MODERATE,
    description: 'Weekly activity frequency multiplier',
  })
  @IsEnum(ActivityLevelEnum)
  activityLevel: ActivityLevelEnum;

  @ApiPropertyOptional({
    enum: DietGoalEnum,
    example: DietGoalEnum.MAINTAIN,
    description: 'Diet goal modifier: loss (-500 kcal), gain (+350 kcal), or maintain',
  })
  @IsOptional()
  @IsEnum(DietGoalEnum)
  dietGoal?: DietGoalEnum;
}
