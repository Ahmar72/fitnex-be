import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class LogSetDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  setNumber?: number;

  @ApiProperty({ example: 10, description: 'Reps completed in this set' })
  @IsInt()
  @Min(1)
  reps: number;

  @ApiProperty({ example: 60, description: 'Weight in kg used in this set' })
  @IsNumber()
  @Min(0)
  weight: number;
}

export class LogExerciseSnapshotDto {
  @ApiProperty({ example: '0001', description: 'Exercise movement ID' })
  @IsString()
  @IsNotEmpty()
  exerciseId: string;

  @ApiPropertyOptional({ example: '3/4 sit-up' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ type: [LogSetDto], description: 'Completed sets for this exercise' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogSetDto)
  sets: LogSetDto[];
}

export class CreateWorkoutSessionDto {
  @ApiPropertyOptional({ example: 'abs-building', description: 'Training plan ID if done as part of a program' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({ example: 'Upper Body Power Day', default: 'Workout' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '2026-11-25', description: 'Date key (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  dateKey?: string;

  @ApiPropertyOptional({ example: 2100, description: 'Workout duration in seconds', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @ApiProperty({
    type: [LogExerciseSnapshotDto],
    description: 'Array of exercises with completed sets',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogExerciseSnapshotDto)
  exercises: LogExerciseSnapshotDto[];
}

export class HistoryQueryDto {
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
