import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum ExerciseSortEnum {
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
}

/**
 * Filter and Pagination Query Parameters for Exercise Catalog
 */
export class FilterExercisesDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    example: 24,
    description: 'Number of exercises per page',
    default: 24,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 24;

  @ApiPropertyOptional({
    example: 'bench press',
    description: 'Search keyword matching exercise name or muscle target',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'chest',
    description: 'Filter by anatomical body part (e.g. chest, back, upper legs, waist)',
  })
  @IsOptional()
  @IsString()
  bodyPart?: string;

  @ApiPropertyOptional({
    example: 'pectorals',
    description: 'Filter by primary target muscle (e.g. abs, pectorals, quads, lats)',
  })
  @IsOptional()
  @IsString()
  target?: string;

  @ApiPropertyOptional({
    example: 'barbell',
    description: 'Filter by equipment needed (e.g. barbell, dumbbell, body weight, cable)',
  })
  @IsOptional()
  @IsString()
  equipment?: string;

  @ApiPropertyOptional({
    enum: ExerciseSortEnum,
    example: ExerciseSortEnum.NAME_ASC,
    description: 'Sort ordering',
    default: ExerciseSortEnum.NAME_ASC,
  })
  @IsOptional()
  @IsEnum(ExerciseSortEnum)
  sort: ExerciseSortEnum = ExerciseSortEnum.NAME_ASC;
}
