import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Meal, MealSchema } from './schemas/meal.schema';
import { NutritionService } from './nutrition.service';
import { NutritionController } from './nutrition.controller';

/**
 * Nutrition & Recipe Catalog Module
 * 
 * Provides macro-calibrated recipes and category discovery.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Meal.name, schema: MealSchema },
    ]),
  ],
  controllers: [NutritionController],
  providers: [NutritionService],
  exports: [NutritionService, MongooseModule],
})
export class NutritionModule {}
