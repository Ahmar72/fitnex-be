import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class WorkoutSetDto {
  @ApiProperty({ example: 'set_1732520000000_1' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 10, default: 10 })
  @IsNumber()
  @Min(1)
  reps: number;

  @ApiProperty({ example: 20, default: 20 })
  @IsNumber()
  @Min(0)
  weight: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  done?: boolean;
}

export class WorkoutItemDto {
  @ApiProperty({ example: 'item_1732520000000_1' })
  @IsString()
  @IsNotEmpty()
  uid: string;

  @ApiProperty({ example: '0001', description: 'Exercise movement ID' })
  @IsString()
  @IsNotEmpty()
  exerciseId: string;

  @ApiProperty({ type: [WorkoutSetDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkoutSetDto)
  sets: WorkoutSetDto[];
}

export class UpdateWorkoutDto {
  @ApiProperty({ example: 'Chest & Arms Power', default: 'My Workout' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: [WorkoutItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkoutItemDto)
  items: WorkoutItemDto[];
}

export class AddWorkoutItemDto {
  @ApiProperty({ example: '0001', description: 'Exercise ID to append to workout' })
  @IsString()
  @IsNotEmpty()
  exerciseId: string;

  @ApiPropertyOptional({ example: 3, default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  sets?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  reps?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;
}

export class RoutineExerciseItemDto {
  @ApiProperty({ example: '0001' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({ example: 3, default: 3 })
  @IsOptional()
  @IsNumber()
  sets?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @IsNumber()
  reps?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @IsNumber()
  weight?: number;
}

export class LoadRoutineDto {
  @ApiProperty({ example: 'Six-Pack Abs & Core Chisel' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: [RoutineExerciseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutineExerciseItemDto)
  list: RoutineExerciseItemDto[];
}
