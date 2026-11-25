import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import {
  WorkoutSession,
  WorkoutSessionSchema,
} from './schemas/workout-session.schema';
import {
  PersonalRecord,
  PersonalRecordSchema,
} from './schemas/personal-record.schema';
import { ExercisesModule } from '../exercises/exercises.module';

/**
 * Workout History Module
 * 
 * Manages live workout session completion, personal records, and training streaks.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkoutSession.name, schema: WorkoutSessionSchema },
      { name: PersonalRecord.name, schema: PersonalRecordSchema },
    ]),
    ExercisesModule,
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
