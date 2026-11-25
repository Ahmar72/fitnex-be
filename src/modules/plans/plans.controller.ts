import {
  Body,
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
import { PlansService } from './plans.service';
import {
  EnrollPlanDto,
  FilterPlansDto,
  ProgressPlanDto,
} from './dto/plan-dtos';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

/**
 * Training Plans & Programs Controller
 * 
 * Provides endpoints for browsing pre-built training plans, categories,
 * active program enrollment, and day-by-day continuous progression.
 */
@ApiTags('Training Plans & Programs')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get all training plans',
    description: 'Retrieves all available workout programs, with optional category filtering (e.g. abs, biceps, chest).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of training plans',
  })
  async findAll(@Query() filterDto: FilterPlansDto) {
    return this.plansService.findAll(filterDto);
  }

  @Public()
  @Get('categories')
  @ApiOperation({
    summary: 'Get plan categories',
    description: 'Retrieves the list of plan categories and display labels.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of plan categories',
  })
  async getCategories() {
    return this.plansService.getCategories();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('active/me')
  @ApiOperation({
    summary: 'Get current user active enrolled plan',
    description: 'Retrieves the signed-in user currently active training plan, current week, and day progression.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active enrolled plan and progress details',
  })
  async getActivePlan(@CurrentUser() user: any) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.plansService.getActivePlan(userId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('enroll')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enroll in a training program',
    description: 'Enrolls the user into a training plan, initializing week 1 and day 0.',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrolled in training plan successfully',
  })
  async enroll(
    @CurrentUser() user: any,
    @Body() dto: EnrollPlanDto,
  ) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.plansService.enroll(userId, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('active/progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Advance active plan progress',
    description: 'Logs completed plan workout day, advances day index or week, or completes program if final week finished.',
  })
  @ApiResponse({
    status: 200,
    description: 'Plan progress updated successfully',
  })
  async progress(
    @CurrentUser() user: any,
    @Body() dto: ProgressPlanDto,
  ) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.plansService.progress(userId, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('active/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel active plan enrollment',
    description: 'Deactivates the current active program enrollment for the user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Plan enrollment canceled successfully',
  })
  async cancel(@CurrentUser() user: any) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.plansService.cancel(userId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get single plan details by ID',
    description: 'Retrieves complete training plan specifications, weekly schedule, and exercise references.',
  })
  @ApiParam({
    name: 'id',
    description: 'Plan identifier (e.g. "abs-building")',
    example: 'abs-building',
  })
  @ApiResponse({
    status: 200,
    description: 'Plan details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Training plan not found',
  })
  async findById(@Param('id') id: string) {
    return this.plansService.findById(id);
  }
}
