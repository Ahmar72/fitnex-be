import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class FilterMealsDto {
  @ApiPropertyOptional({
    example: 'lunch',
    description: 'Filter by meal category (breakfast, lunch, dinner, snack, pre-workout, post-workout, all)',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: 'muscle',
    description: 'Filter by fitness goal (muscle, fat, fit, strength, all)',
  })
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiPropertyOptional({
    example: 'chicken',
    description: 'Search query matching recipe name, brief description, or ingredients',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'calories_asc',
    description: 'Sorting strategy (name_asc, calories_asc, calories_desc, protein_desc)',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class LogMealDto {
  @ApiPropertyOptional({
    example: 'grilled-chicken-rice',
    description: 'Meal recipe ID from catalog (if logging a known recipe)',
  })
  @IsOptional()
  @IsString()
  mealId?: string;

  @ApiProperty({
    example: 'Grilled Chicken & Brown Rice',
    description: 'Meal name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'lunch',
    default: 'lunch',
    description: 'Meal type category (breakfast, lunch, dinner, snack, pre-workout, post-workout)',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: '2026-11-25',
    description: 'Date key (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  dateKey?: string;

  @ApiProperty({ example: 540, description: 'Calories in kcal' })
  @IsNumber()
  @Min(0)
  calories: number;

  @ApiProperty({ example: 48, description: 'Protein in grams' })
  @IsNumber()
  @Min(0)
  protein: number;

  @ApiProperty({ example: 52, description: 'Carbohydrates in grams' })
  @IsNumber()
  @Min(0)
  carbs: number;

  @ApiProperty({ example: 10, description: 'Fat in grams' })
  @IsNumber()
  @Min(0)
  fat: number;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Number of servings' })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  servings?: number;
}
