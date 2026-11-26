import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type UserActivePlanDocument = HydratedDocument<UserActivePlan>;

/**
 * User Active Plan Mongoose Schema
 * 
 * Tracks the signed-in user's active plan enrollment, current week & day progression,
 * and workout completion dates.
 */
@Schema({
  collection: 'user_active_plans',
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
export class UserActivePlan extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  planId: string;

  @Prop({ default: 1, min: 1 })
  currentWeek: number;

  @Prop({ default: 0, min: 0, max: 6 })
  currentDayIndex: number;

  @Prop({ default: 4, min: 2, max: 6 })
  daysPerWeek: number;

  @Prop({ type: [String], default: [] })
  completedDates: string[];

  @Prop({ default: null })
  lastWorkoutDate: string;

  @Prop({ default: () => new Date() })
  enrolledAt: Date;

  @Prop({ default: null })
  completedAt: Date;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const UserActivePlanSchema = SchemaFactory.createForClass(UserActivePlan);

// Index on userId and isActive for rapid lookup of active enrollments
UserActivePlanSchema.index({ userId: 1, isActive: 1 });
