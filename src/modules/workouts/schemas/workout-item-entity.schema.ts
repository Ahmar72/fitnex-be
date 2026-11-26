import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { WorkoutSet, WorkoutSetSchema } from './workout.schema';

export type WorkoutItemEntityDocument = HydratedDocument<WorkoutItemEntity>;

/**
 * Workout Item Mongoose Schema
 * 
 * Normalized collection representing an exercise item configured
 * within a user's workout draft or routine template.
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

  @Prop({ type: [WorkoutSetSchema], default: [] })
  sets: WorkoutSet[];
}

export const WorkoutItemEntitySchema = SchemaFactory.createForClass(WorkoutItemEntity);
WorkoutItemEntitySchema.index({ workoutId: 1, exerciseId: 1 });
WorkoutItemEntitySchema.index({ userId: 1 });
