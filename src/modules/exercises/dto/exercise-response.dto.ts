import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Exercise Response Item DTO
 */
export class ExerciseItemDto {
  @ApiProperty({ example: '0001' })
  id: string;

  @ApiProperty({ example: '0001' })
  exerciseId: string;

  @ApiProperty({ example: '3/4 sit-up' })
  name: string;

  @ApiProperty({ example: 'waist' })
  bodyPart: string;

  @ApiProperty({ example: 'body weight' })
  equipment: string;

  @ApiProperty({ example: 'abs' })
  target: string;

  @ApiPropertyOptional({ example: 'hip flexors' })
  muscleGroup?: string;

  @ApiProperty({ example: ['hip flexors', 'lower back'] })
  secondary: string[];

  @ApiProperty({ example: 'images/0001-2gPfomN.jpg' })
  image: string;

  @ApiProperty({ example: 'videos/0001-2gPfomN.gif' })
  gif: string;

  @ApiProperty({
    example: [
      'Lie flat on your back with your knees bent and feet flat on the ground.',
      'Place your hands behind your head with your elbows pointing outwards.',
    ],
  })
  steps: string[];

  @ApiPropertyOptional({
    description: 'Multi-lingual localized steps keyed by ISO language code',
  })
  i18n?: Record<string, string[]>;
}

/**
 * Paginated Exercises Catalog Response DTO
 */
export class PaginatedExercisesDto {
  @ApiProperty({ type: [ExerciseItemDto] })
  items: ExerciseItemDto[];

  @ApiProperty({ example: 1324, description: 'Total matched exercises count' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 24, description: 'Limit per page' })
  limit: number;

  @ApiProperty({ example: 56, description: 'Total available pages' })
  totalPages: number;
}
