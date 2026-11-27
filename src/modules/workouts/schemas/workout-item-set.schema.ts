import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type WorkoutItemSetDocument = HydratedDocument<WorkoutItemSet>;

/**
 * Workout Item Set Mongoose Schema
 *
 * Normalized flat collection representing individual sets configured
 * inside a workout builder item.
 */
@Schema({
  collection: 'workout_item_sets',
  timestamps: true,
  toJSON: {
    transform: (_, ret: any) => {
      ret.id = ret.setId || ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class WorkoutItemSet extends Document {
  @Prop({ type: Types.ObjectId, ref: 'WorkoutItemEntity', required: true, index: true })
  workoutItemId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Workout', required: true, index: true })
  workoutId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Exercise', required: true })
  exerciseId: Types.ObjectId;

  @Prop({ required: true })
  setId: string;

  @Prop({ required: true, default: 1 })
  setNumber: number;

  @Prop({ required: true, default: 10, min: 1 })
  reps: number;

  @Prop({ required: true, default: 20, min: 0 })
  weight: number;

  @Prop({ default: false })
  done: boolean;
}

export const WorkoutItemSetSchema = SchemaFactory.createForClass(WorkoutItemSet);
WorkoutItemSetSchema.index({ workoutItemId: 1, setNumber: 1 });
