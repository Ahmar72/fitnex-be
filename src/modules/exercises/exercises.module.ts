import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { Exercise, ExerciseSchema } from './schemas/exercise.schema';
import {
  ExerciseFavorite,
  ExerciseFavoriteSchema,
} from './schemas/exercise-favorite.schema';

/**
 * Exercises Module
 * 
 * Encapsulates the 1,324 movements catalog, multi-lingual instruction guides,
 * faceted search filters, and user favorite bookmarks.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exercise.name, schema: ExerciseSchema },
      { name: ExerciseFavorite.name, schema: ExerciseFavoriteSchema },
    ]),
  ],
  controllers: [ExercisesController],
  providers: [ExercisesService],
  exports: [ExercisesService],
})
export class ExercisesModule {}
