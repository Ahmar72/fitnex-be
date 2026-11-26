import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type WorkoutDocument = HydratedDocument<Workout>;

@Schema({ _id: false })
export class WorkoutSet {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true, default: 10, min: 1 })
  reps: number;

  @Prop({ required: true, default: 20, min: 0 })
  weight: number;

  @Prop({ default: false })
  done: boolean;
}
export const WorkoutSetSchema = SchemaFactory.createForClass(WorkoutSet);

@Schema({ _id: false })
export class WorkoutItem {
  @Prop({ required: true })
  uid: string;

  @Prop({ required: true, index: true })
  exerciseId: string;

  @Prop({ type: [WorkoutSetSchema], default: [] })
  sets: WorkoutSet[];
}
export const WorkoutItemSchema = SchemaFactory.createForClass(WorkoutItem);

/**
 * Workout Mongoose Schema
 * 
 * Represents an active builder workout draft or custom routine template.
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

  @Prop({ type: [WorkoutItemSchema], default: [] })
  items: WorkoutItem[];

  @Prop({ default: false })
  isTemplate: boolean;
}

export const WorkoutSchema = SchemaFactory.createForClass(Workout);

// Index on userId and isTemplate for rapid builder draft queries
WorkoutSchema.index({ userId: 1, isTemplate: 1 });
