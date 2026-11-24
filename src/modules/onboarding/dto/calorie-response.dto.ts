import { ApiProperty } from '@nestjs/swagger';

export class MacroDistributionDto {
  @ApiProperty({ example: 177, description: 'Daily protein target in grams (30% total calories)' })
  protein: number;

  @ApiProperty({ example: 236, description: 'Daily carbohydrate target in grams (40% total calories)' })
  carbs: number;

  @ApiProperty({ example: 79, description: 'Daily fat target in grams (30% total calories)' })
  fat: number;
}

/**
 * Calorie Calculation Response DTO
 */
export class CalorieResponseDto {
  @ApiProperty({ example: 1548, description: 'Basal Metabolic Rate in kcal' })
  bmr: number;

  @ApiProperty({ example: 2399, description: 'Total Daily Energy Expenditure in kcal' })
  tdee: number;

  @ApiProperty({ example: 2355, description: 'Goal-tailored daily calorie target in kcal' })
  targetCalories: number;

  @ApiProperty({ example: 70, description: 'Normalized weight in kilograms' })
  weightKg: number;

  @ApiProperty({ example: 170, description: 'Normalized height in centimeters' })
  heightCm: number;

  @ApiProperty({ type: MacroDistributionDto, description: 'Suggested macronutrient breakdown' })
  macros: MacroDistributionDto;
}
