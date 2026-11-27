import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type WorkoutSessionExerciseDocument = HydratedDocument<WorkoutSessionExercise>;

/**
 * Workout Session Exercise Mongoose Schema
 *
 * Normalized flat collection representing individual exercises performed
 * within a workout session. Individual sets are stored in `workout_session_sets`.
 */
@Schema({
  collection: 'workout_session_exercises',
  timestamps: true,
  toJSON: {
    transform: (_, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class WorkoutSessionExercise extends Document {
  @Prop({ type: Types.ObjectId, ref: 'WorkoutSession', required: true, index: true })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Exercise', required: true, index: true })
  exerciseId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  exerciseName: string;

  @Prop({ default: '' })
  bodyPart: string;

  @Prop({ default: '' })
  target: string;

  @Prop({ default: 0 })
  setsCount: number;

  @Prop({ default: 0 })
  completedReps: number;

  @Prop({ default: 0 })
  totalVolumeKg: number;

  @Prop({ default: 0 })
  maxWeight: number;
}

export const WorkoutSessionExerciseSchema = SchemaFactory.createForClass(WorkoutSessionExercise);
WorkoutSessionExerciseSchema.index({ sessionId: 1, exerciseId: 1 });
WorkoutSessionExerciseSchema.index({ userId: 1, exerciseId: 1 });
