import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { Plan, PlanSchema } from './schemas/plan.schema';
import {
  UserActivePlan,
  UserActivePlanSchema,
} from './schemas/user-active-plan.schema';
import {
  PlanOverview,
  PlanOverviewSchema,
} from './schemas/plan-overview.schema';
import {
  PlanSchedule,
  PlanScheduleSchema,
} from './schemas/plan-schedule.schema';

/**
 * Plans Module
 * 
 * Manages training programs, schedules, multi-week progression, and user enrollment.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Plan.name, schema: PlanSchema },
      { name: UserActivePlan.name, schema: UserActivePlanSchema },
      { name: PlanOverview.name, schema: PlanOverviewSchema },
      { name: PlanSchedule.name, schema: PlanScheduleSchema },
    ]),
  ],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
