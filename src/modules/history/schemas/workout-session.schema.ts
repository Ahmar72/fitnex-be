import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type WorkoutSessionDocument = HydratedDocument<WorkoutSession>;

@Schema({ _id: false })
export class SessionSet {
  @Prop({ required: true, default: 1 })
  setNumber: number;

  @Prop({ required: true, min: 1 })
  reps: number;

  @Prop({ required: true, min: 0 })
  weight: number;

  @Prop({ default: false })
  isPR: boolean;
}
export const SessionSetSchema = SchemaFactory.createForClass(SessionSet);

@Schema({ _id: false })
export class SessionExerciseSnapshot {
  @Prop({ required: true, index: true })
  exerciseId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '' })
  bodyPart: string;

  @Prop({ default: '' })
  target: string;

  @Prop({ type: [SessionSetSchema], default: [] })
  sets: SessionSet[];
}
export const SessionExerciseSnapshotSchema = SchemaFactory.createForClass(SessionExerciseSnapshot);

/**
 * Workout Session Mongoose Schema
 * 
 * Records completed live workout sessions with volume metrics, completed sets/reps,
 * anatomical targets, and personal record detections.
 */
@Schema({
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

  @Prop({ type: [String], default: [] })
  exercises: string[];

  @Prop({ type: [SessionExerciseSnapshotSchema], default: [] })
  exerciseSnapshots: SessionExerciseSnapshot[];

  @Prop({ default: () => new Date(), index: true })
  completedAt: Date;
}

export const WorkoutSessionSchema = SchemaFactory.createForClass(WorkoutSession);

// Compound indexes for history queries and analytics
WorkoutSessionSchema.index({ userId: 1, dateKey: -1 });
WorkoutSessionSchema.index({ userId: 1, completedAt: -1 });
