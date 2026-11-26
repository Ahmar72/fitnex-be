import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
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
