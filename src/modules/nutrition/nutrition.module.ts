import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Meal, MealSchema } from './schemas/meal.schema';
import {
  UserMealFavorite,
  UserMealFavoriteSchema,
} from './schemas/user-meal-favorite.schema';
import {
  UserMealLog,
  UserMealLogSchema,
} from './schemas/user-meal-log.schema';
import { NutritionService } from './nutrition.service';
import { NutritionController } from './nutrition.controller';
import { OnboardingModule } from '../onboarding/onboarding.module';

/**
 * Nutrition & Meal Planner Module
 * 
 * Provides macro-calibrated recipes, food logging, and daily caloric tracking.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Meal.name, schema: MealSchema },
      { name: UserMealFavorite.name, schema: UserMealFavoriteSchema },
      { name: UserMealLog.name, schema: UserMealLogSchema },
    ]),
    OnboardingModule,
  ],
  controllers: [NutritionController],
  providers: [NutritionService],
  exports: [NutritionService, MongooseModule],
})
export class NutritionModule {}
