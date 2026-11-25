import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NutritionService } from './nutrition.service';
import { FilterMealsDto, LogMealDto } from './dto/nutrition-dtos';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

/**
 * Nutrition & Meal Planner Controller
 * 
 * Provides endpoints for recipe browsing, category discovery,
 * user bookmarks, daily food logging, and macronutrient targets tracking.
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

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('favorites/me')
  @ApiOperation({
    summary: 'Get user favorite meals',
    description: 'Retrieves all meal recipe IDs bookmarked by the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Array of favorite meal IDs' })
  async getFavorites(@CurrentUser('id') userId: string) {
    return this.nutritionService.getFavorites(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('favorites/:mealId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Toggle favorite meal bookmark',
    description: 'Bookmarks or unbookmarks a meal recipe for the authenticated user.',
  })
  @ApiParam({ name: 'mealId', description: 'Recipe identifier (e.g. oats-whey-bowl)' })
  @ApiResponse({ status: 200, description: 'Updated favorite status' })
  async toggleFavorite(
    @CurrentUser('id') userId: string,
    @Param('mealId') mealId: string,
  ) {
    return this.nutritionService.toggleFavorite(userId, mealId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('daily-summary')
  @ApiOperation({
    summary: 'Daily caloric & macronutrient summary',
    description: 'Compares consumed nutrients from logs against user metabolic targets.',
  })
  @ApiQuery({ name: 'dateKey', required: false, description: 'YYYY-MM-DD date key (defaults to today)' })
  @ApiResponse({ status: 200, description: 'Daily nutrition summary and targets' })
  async getDailySummary(
    @CurrentUser('id') userId: string,
    @Query('dateKey') dateKey?: string,
  ) {
    return this.nutritionService.getDailySummary(userId, dateKey);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('logs/me')
  @ApiOperation({
    summary: 'Get meal logs for date',
    description: 'Retrieves food logs recorded by the user for a specific date.',
  })
  @ApiQuery({ name: 'dateKey', required: false, description: 'YYYY-MM-DD date key (defaults to today)' })
  @ApiResponse({ status: 200, description: 'List of logged meals for the day' })
  async getLogs(
    @CurrentUser('id') userId: string,
    @Query('dateKey') dateKey?: string,
  ) {
    return this.nutritionService.getLogs(userId, dateKey);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logs')
  @ApiOperation({
    summary: 'Log a consumed meal',
    description: 'Records a meal entry with calories and macros for daily tracking.',
  })
  @ApiResponse({ status: 201, description: 'Logged meal entry created' })
  async logMeal(
    @CurrentUser('id') userId: string,
    @Body() dto: LogMealDto,
  ) {
    return this.nutritionService.logMeal(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('logs/:logId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete meal log entry',
    description: 'Removes a previously logged food item by ID.',
  })
  @ApiParam({ name: 'logId', description: 'Log entry ObjectId' })
  @ApiResponse({ status: 200, description: 'Meal log removed' })
  async deleteLog(
    @CurrentUser('id') userId: string,
    @Param('logId') logId: string,
  ) {
    return this.nutritionService.deleteLog(userId, logId);
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
