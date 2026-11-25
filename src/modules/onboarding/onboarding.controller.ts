import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { CalculateCaloriesDto } from './dto/calculate-calories.dto';
import { SaveOnboardingDto } from './dto/save-onboarding.dto';
import { CalorieResponseDto } from './dto/calorie-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

/**
 * Onboarding Controller
 * 
 * Provides endpoints for metabolic calculation and onboarding state persistence.
 */
@ApiTags('Onboarding & Metabolic Calculator')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Public()
  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate BMR, TDEE, and macronutrient targets',
    description: 'Stateless metabolic calculator using the Mifflin-St Jeor equation. Can be used by guest users or client apps.',
  })
  @ApiResponse({
    status: 200,
    description: 'Metabolic calculation computed successfully',
    type: CalorieResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed on input parameters',
  })
  calculate(@Body() dto: CalculateCaloriesDto): CalorieResponseDto {
    return this.onboardingService.calculateMetabolism(dto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('save')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save completed onboarding profile',
    description: 'Computes targets and saves user physical statistics, training goal, and calorie targets in MongoDB.',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding profile saved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or expired token',
  })
  async saveOnboarding(
    @CurrentUser('id') userId: string,
    @Body() dto: SaveOnboardingDto,
  ) {
    const profile = await this.onboardingService.saveOnboarding(userId, dto);
    return {
      message: 'Onboarding profile saved successfully',
      data: profile,
    };
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit completed onboarding profile (standard PRD alias)',
    description: 'Computes targets and saves user physical statistics, training goal, and calorie targets in MongoDB.',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding profile saved successfully',
  })
  async submitOnboarding(
    @CurrentUser('id') userId: string,
    @Body() dto: SaveOnboardingDto,
  ) {
    const profile = await this.onboardingService.saveOnboarding(userId, dto);
    return {
      message: 'Onboarding profile saved successfully',
      data: profile,
    };
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Get current user onboarding and metabolic profile',
    description: 'Retrieves saved fitness goal, schedule, calorie target, and macronutrients for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding profile retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Onboarding profile not found for this user',
  })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.onboardingService.getProfile(userId);
  }
}
