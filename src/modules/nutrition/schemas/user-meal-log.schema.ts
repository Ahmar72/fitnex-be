import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type UserMealLogDocument = HydratedDocument<UserMealLog>;

/**
 * User Meal Log Mongoose Schema
 * 
 * Tracks consumed meals, calories, and macronutrients against daily targets.
 */
@Schema({
  collection: 'user_meal_logs',
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
export class UserMealLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ default: null, index: true })
  mealId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true, default: 'snack' })
  category: string;

  @Prop({ required: true, index: true })
  dateKey: string;

  @Prop({ required: true, min: 0 })
  calories: number;

  @Prop({ required: true, min: 0 })
  protein: number;

  @Prop({ required: true, min: 0 })
  carbs: number;

  @Prop({ required: true, min: 0 })
  fat: number;

  @Prop({ default: 1, min: 0.1 })
  servings: number;

  @Prop({ default: () => new Date(), index: true })
  loggedAt: Date;
}

export const UserMealLogSchema = SchemaFactory.createForClass(UserMealLog);

// Compound index for querying user logs by dateKey
UserMealLogSchema.index({ userId: 1, dateKey: -1 });
