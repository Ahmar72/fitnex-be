import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';
import { Workout, WorkoutSchema } from './schemas/workout.schema';
import {
  WorkoutItemEntity,
  WorkoutItemEntitySchema,
} from './schemas/workout-item-entity.schema';
import {
  WorkoutItemSet,
  WorkoutItemSetSchema,
} from './schemas/workout-item-set.schema';
import { ExercisesModule } from '../exercises/exercises.module';

/**
 * Workouts Module
 * 
 * Manages user workout drafts, routine loading, set/rep builders, and workout state persistence.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workout.name, schema: WorkoutSchema },
      { name: WorkoutItemEntity.name, schema: WorkoutItemEntitySchema },
      { name: WorkoutItemSet.name, schema: WorkoutItemSetSchema },
    ]),
    ExercisesModule,
  ],
  controllers: [WorkoutsController],
  providers: [WorkoutsService],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
