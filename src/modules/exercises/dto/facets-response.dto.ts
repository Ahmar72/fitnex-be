import { ApiProperty } from '@nestjs/swagger';

export class FacetItemDto {
  @ApiProperty({ example: 'chest' })
  name: string;

  @ApiProperty({ example: 142 })
  count: number;
}

/**
 * Exercise Facets Response DTO
 * Aggregated taxonomy counts across the 1,324 movements catalog
 */
export class ExerciseFacetsDto {
  @ApiProperty({ type: [FacetItemDto] })
  bodyParts: FacetItemDto[];

  @ApiProperty({ type: [FacetItemDto] })
  targets: FacetItemDto[];

  @ApiProperty({ type: [FacetItemDto] })
  equipment: FacetItemDto[];
}
