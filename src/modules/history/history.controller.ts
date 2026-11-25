import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HistoryService } from './history.service';
import {
  CreateWorkoutSessionDto,
  HistoryQueryDto,
} from './dto/create-session.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

/**
 * Workout History & Sessions Controller
 * 
 * Provides endpoints for logging live workouts, tracking set progressions,
 * computing training streaks, and querying personal records (PRs).
 */
@ApiTags('Workout History & Sessions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Get paginated workout history logs',
    description: 'Retrieves completed workout sessions for the authenticated user, sorted by date descending.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of workout sessions',
  })
  async getHistory(
    @CurrentUser() user: any,
    @Query() queryDto: HistoryQueryDto,
  ) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.historyService.getHistory(userId, queryDto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Log a completed live workout session',
    description: 'Saves workout duration, completed sets, reps, weight volume, and detects new personal records.',
  })
  @ApiResponse({
    status: 201,
    description: 'Workout session logged and personal records updated',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failure: missing exercises or sets',
  })
  async logSession(
    @CurrentUser() user: any,
    @Body() dto: CreateWorkoutSessionDto,
  ) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.historyService.logSession(userId, dto);
  }

  @Get('streak')
  @ApiOperation({
    summary: 'Calculate consecutive training days streak',
    description: 'Computes consecutive workout days ending today or yesterday.',
  })
  @ApiResponse({
    status: 200,
    description: 'Streak count and last trained date',
  })
  async getStreak(@CurrentUser() user: any) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.historyService.calculateStreak(userId);
  }

  @Get('prs')
  @ApiOperation({
    summary: 'Get all personal records (PRs)',
    description: 'Retrieves personal bests per exercise for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of personal records per exercise',
  })
  async getPersonalRecords(@CurrentUser() user: any) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.historyService.getPersonalRecords(userId);
  }
}
