import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WorkoutsService } from './workouts.service';
import {
  AddWorkoutItemDto,
  LoadRoutineDto,
  UpdateWorkoutDto,
} from './dto/update-workout.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

/**
 * Workouts Builder Controller
 * 
 * Provides endpoints for managing the signed-in user's live workout builder draft,
 * custom item modifications, set tracking, and routine loading.
 */
@ApiTags('Workouts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Get('current')
  @ApiOperation({
    summary: 'Get active builder workout draft',
    description: 'Retrieves the current draft workout for the authenticated user, or returns a fresh draft if none exists.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active workout draft retrieved successfully',
  })
  async getCurrent(@CurrentUser() user: any) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.workoutsService.getCurrentWorkout(userId);
  }

  @Put('current')
  @ApiOperation({
    summary: 'Save or overwrite full builder workout draft',
    description: 'Saves the entire workout draft state (exercise items, sets, target reps, and weights).',
  })
  @ApiResponse({
    status: 200,
    description: 'Workout draft saved successfully',
  })
  async saveCurrent(
    @CurrentUser() user: any,
    @Body() dto: UpdateWorkoutDto,
  ) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.workoutsService.saveCurrentWorkout(userId, dto);
  }

  @Post('current/items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add an exercise to the active workout',
    description: 'Appends a new exercise movement with default sets to the current workout draft.',
  })
  @ApiResponse({
    status: 200,
    description: 'Exercise added to workout successfully',
  })
  async addItem(
    @CurrentUser() user: any,
    @Body() dto: AddWorkoutItemDto,
  ) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.workoutsService.addItem(userId, dto);
  }

  @Delete('current/items/:itemId')
  @ApiOperation({
    summary: 'Remove an exercise item from active workout',
    description: 'Deletes an exercise item and its sets by UID from the active draft.',
  })
  @ApiParam({
    name: 'itemId',
    description: 'Workout item UID (e.g. "item_...")',
  })
  @ApiResponse({
    status: 200,
    description: 'Exercise item removed successfully',
  })
  async removeItem(
    @CurrentUser() user: any,
    @Param('itemId') itemId: string,
  ) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.workoutsService.removeItem(userId, itemId);
  }

  @Post('load-routine')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Load a routine template into the builder',
    description: 'Overwrites the active builder workout draft with exercises from a pre-configured routine template.',
  })
  @ApiResponse({
    status: 200,
    description: 'Routine loaded into builder draft successfully',
  })
  async loadRoutine(
    @CurrentUser() user: any,
    @Body() dto: LoadRoutineDto,
  ) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.workoutsService.loadRoutine(userId, dto);
  }
}
