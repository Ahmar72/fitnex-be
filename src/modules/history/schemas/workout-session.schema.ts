import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type WorkoutSessionDocument = HydratedDocument<WorkoutSession>;

/**
 * Workout Session Mongoose Schema
 *
 * Clean, flat session summary document. Exercise details and set logs are
 * normalized into `workout_session_exercises` and `workout_session_sets`.
 */
@Schema({
  collection: 'workout_sessions',
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
export class WorkoutSession extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ default: null, index: true })
  planId: string;

  @Prop({ required: true, index: true })
  dateKey: string;

  @Prop({ required: true, default: 'Workout', trim: true })
  name: string;

  @Prop({ default: 0, min: 0 })
  durationSeconds: number;

  @Prop({ required: true, default: 0, min: 0 })
  totalVolumeKg: number;

  @Prop({ required: true, default: 0, min: 0 })
  completedSets: number;

  @Prop({ required: true, default: 0, min: 0 })
  completedReps: number;

  @Prop({ default: 0, min: 0 })
  prsCount: number;

  @Prop({ type: [String], default: [] })
  trainedTargets: string[];

  @Prop({ type: [Types.ObjectId], ref: 'Exercise', default: [] })
  exercises: Types.ObjectId[];

  @Prop({ default: () => new Date(), index: true })
  completedAt: Date;
}

export const WorkoutSessionSchema = SchemaFactory.createForClass(WorkoutSession);

// Compound indexes for history queries and analytics
WorkoutSessionSchema.index({ userId: 1, dateKey: -1 });
WorkoutSessionSchema.index({ userId: 1, completedAt: -1 });
