import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { NutritionService } from './nutrition.service';
import { FilterMealsDto } from './dto/nutrition-dtos';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Nutrition & Recipe Catalog Controller
 * 
 * Provides endpoints for recipe browsing, category discovery,
 * and individual recipe details.
 */
@ApiTags('Nutrition')
@Controller('meals')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Browse recipe catalog',
    description: 'Retrieve paginated meal recipes filtered by category, goal, keyword search, and macro sorting.',
  })
  @ApiResponse({ status: 200, description: 'Paginated recipe catalog' })
  async findAll(@Query() filterDto: FilterMealsDto) {
    return this.nutritionService.findAll(filterDto);
  }

  @Public()
  @Get('categories')
  @ApiOperation({
    summary: 'Get meal categories',
    description: 'Returns available recipe category taxonomy.',
  })
  @ApiResponse({ status: 200, description: 'List of meal categories' })
  getCategories() {
    return this.nutritionService.getCategories();
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get recipe details by ID',
    description: 'Retrieves detailed recipe information including ingredients, prep steps, and macros.',
  })
  @ApiParam({ name: 'id', description: 'Meal recipe ID or MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Full recipe details' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async findById(@Param('id') id: string) {
    return this.nutritionService.findById(id);
  }
}
