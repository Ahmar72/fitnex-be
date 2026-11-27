import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type WorkoutItemEntityDocument = HydratedDocument<WorkoutItemEntity>;

/**
 * Workout Item Mongoose Schema
 *
 * Normalized flat collection representing an exercise item configured
 * within a user's workout draft. Sets live in `workout_item_sets`.
 */
@Schema({
  collection: 'workout_items',
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
export class WorkoutItemEntity extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Workout', required: true, index: true })
  workoutId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Exercise', required: true, index: true })
  exerciseId: Types.ObjectId;

  @Prop({ required: true })
  uid: string;

  @Prop({ default: 0 })
  order: number;
}

export const WorkoutItemEntitySchema = SchemaFactory.createForClass(WorkoutItemEntity);
WorkoutItemEntitySchema.index({ workoutId: 1, order: 1 });
