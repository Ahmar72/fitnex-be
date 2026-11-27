import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type WorkoutSessionSetDocument = HydratedDocument<WorkoutSessionSet>;

/**
 * Workout Session Set Mongoose Schema
 *
 * Normalized flat collection representing individual sets completed
 * during a workout session exercise.
 */
@Schema({
  collection: 'workout_session_sets',
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
export class WorkoutSessionSet extends Document {
  @Prop({ type: Types.ObjectId, ref: 'WorkoutSessionExercise', required: true, index: true })
  sessionExerciseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WorkoutSession', required: true, index: true })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Exercise', required: true, index: true })
  exerciseId: Types.ObjectId;

  @Prop({ required: true, default: 1 })
  setNumber: number;

  @Prop({ required: true, min: 1 })
  reps: number;

  @Prop({ required: true, min: 0 })
  weight: number;

  @Prop({ default: false })
  isPR: boolean;
}

export const WorkoutSessionSetSchema = SchemaFactory.createForClass(WorkoutSessionSet);
WorkoutSessionSetSchema.index({ sessionExerciseId: 1, setNumber: 1 });
