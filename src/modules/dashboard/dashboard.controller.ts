import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

/**
 * Dashboard & Aggregates Controller
 * 
 * Provides high-performance consolidated dashboard metrics in a single query.
 */
@ApiTags('Dashboard & Aggregates')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get consolidated user dashboard overview',
    description: 'Retrieves active plan status, weekly streak, total workouts, volume lifted this week, and calorie targets in one request.',
  })
  @ApiResponse({
    status: 200,
    description: 'Consolidated dashboard metrics retrieved successfully',
  })
  async getSummary(@CurrentUser() user: any) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.dashboardService.getSummary(userId);
  }
}
