import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type PlanScheduleDocument = HydratedDocument<PlanSchedule>;

/**
 * Plan Schedule Mongoose Schema
 *
 * Normalized collection representing each day's routine in a training plan.
 */
@Schema({
  collection: 'plan_schedules',
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
export class PlanSchedule extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Plan', required: true, index: true })
  planId: Types.ObjectId;

  @Prop({ required: true, index: true })
  planSlug: string;

  @Prop({ required: true, default: 0 })
  dayIndex: number;

  @Prop({ required: true })
  day: string;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  focus: string;

  @Prop({ default: false })
  isRest: boolean;

  @Prop({ type: [String], default: [] })
  exerciseIds: string[];
}

export const PlanScheduleSchema = SchemaFactory.createForClass(PlanSchedule);
PlanScheduleSchema.index({ planId: 1, dayIndex: 1 });
