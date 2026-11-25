import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class EnrollPlanDto {
  @ApiProperty({
    example: 'abs-building',
    description: 'Target plan program identifier',
  })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiPropertyOptional({
    example: 4,
    description: 'Custom weekly training frequency (2-6 days)',
    default: 4,
  })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(6)
  daysPerWeek?: number;
}

export class ProgressPlanDto {
  @ApiPropertyOptional({
    example: '2026-11-25',
    description: 'Date key of completed session in YYYY-MM-DD format',
  })
  @IsOptional()
  @IsString()
  dateKey?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Day index completed within weekly cycle (0-6)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayIndex?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Current program week (1-6)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  week?: number;
}

export class FilterPlansDto {
  @ApiPropertyOptional({
    example: 'abs',
    description: 'Filter plans by category key (e.g. abs, biceps, chest, all)',
  })
  @IsOptional()
  @IsString()
  category?: string;
}
