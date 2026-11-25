import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { HistoryModule } from '../history/history.module';
import { PlansModule } from '../plans/plans.module';
import { OnboardingModule } from '../onboarding/onboarding.module';

/**
 * Dashboard Module
 * 
 * Aggregates consolidated dashboard overview metrics.
 */
@Module({
  imports: [HistoryModule, PlansModule, OnboardingModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
