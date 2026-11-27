import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type WorkoutDocument = HydratedDocument<Workout>;

/**
 * Workout Mongoose Schema
 *
 * Clean, flat header document representing an active builder workout draft
 * or custom routine template. Items and sets live in `workout_items` and `workout_item_sets`.
 */
@Schema({
  collection: 'workouts',
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
export class Workout extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: 'My Workout', trim: true })
  name: string;

  @Prop({ default: false })
  isTemplate: boolean;
}

export const WorkoutSchema = SchemaFactory.createForClass(Workout);

// Index on userId and isTemplate for rapid builder draft queries
WorkoutSchema.index({ userId: 1, isTemplate: 1 });
