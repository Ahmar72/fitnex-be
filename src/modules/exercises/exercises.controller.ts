import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ExercisesService } from './exercises.service';
import { FilterExercisesDto } from './dto/filter-exercises.dto';
import {
  ExerciseItemDto,
  PaginatedExercisesDto,
} from './dto/exercise-response.dto';
import { ExerciseFacetsDto } from './dto/facets-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

/**
 * Exercises Catalog Controller
 * 
 * Provides endpoints for browsing, searching, and filtering the 1,324 exercise movements,
 * taxonomy facets aggregation, multi-lingual instruction retrieval, and user favorites.
 */
@ApiTags('Exercises')
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Query paginated exercises catalog',
    description: 'Retrieve exercises with optional search by keyword, body part, target muscle, equipment, and sorting.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of exercises',
    type: PaginatedExercisesDto,
  })
  async findAll(@Query() filterDto: FilterExercisesDto): Promise<PaginatedExercisesDto> {
    return this.exercisesService.findAll(filterDto);
  }

  @Public()
  @Get('facets')
  @ApiOperation({
    summary: 'Get exercise taxonomy facet counts',
    description: 'Retrieves aggregated distribution counts across all body parts, target muscles, and equipment types.',
  })
  @ApiResponse({
    status: 200,
    description: 'Taxonomy facets aggregation',
    type: ExerciseFacetsDto,
  })
  async getFacets(): Promise<ExerciseFacetsDto> {
    return this.exercisesService.getFacets();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('favorites/me')
  @ApiOperation({
    summary: 'Get authenticated user favorited exercise IDs',
    description: 'Returns an array of exercise ID strings bookmarked by the signed-in user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of favorited exercise IDs',
    type: [String],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing Bearer token',
  })
  async getUserFavorites(@CurrentUser() user: any): Promise<string[]> {
    const userId = user?.id || user?._id?.toString() || user;
    return this.exercisesService.getUserFavorites(userId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Toggle favorite bookmark for an exercise',
    description: 'Adds or removes the exercise from the signed-in user favorites list.',
  })
  @ApiParam({
    name: 'id',
    description: 'Exercise ID (e.g. "0001") or MongoDB ObjectID',
    example: '0001',
  })
  @ApiResponse({
    status: 200,
    description: 'Favorite status toggled successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing Bearer token',
  })
  @ApiResponse({
    status: 404,
    description: 'Exercise not found',
  })
  async toggleFavorite(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.exercisesService.toggleFavorite(userId, id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get single exercise details by ID',
    description: 'Retrieves complete exercise details including animated GIF/image assets, primary/secondary targets, and multi-lingual steps.',
  })
  @ApiParam({
    name: 'id',
    description: 'Exercise ID (e.g. "0001") or MongoDB ObjectID',
    example: '0001',
  })
  @ApiResponse({
    status: 200,
    description: 'Complete exercise details with localized steps',
    type: ExerciseItemDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Exercise not found',
  })
  async findById(@Param('id') id: string) {
    return this.exercisesService.findByIdWithTranslations(id);
  }
}
