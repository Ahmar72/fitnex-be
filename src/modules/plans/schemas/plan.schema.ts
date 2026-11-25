import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type PlanDocument = HydratedDocument<Plan>;

@Schema({ _id: false })
export class PlanOverviewItem {
  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  value: string;
}
export const PlanOverviewItemSchema = SchemaFactory.createForClass(PlanOverviewItem);

@Schema({ _id: false })
export class PlanDaySchedule {
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
export const PlanDayScheduleSchema = SchemaFactory.createForClass(PlanDaySchedule);

/**
 * Plan Mongoose Schema
 * 
 * Represents a pre-built training plan program with schedules, target muscles,
 * and weekly progression structures.
 */
@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret: any) => {
      ret.id = ret.planId || ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Plan extends Document {
  @Prop({ required: true, unique: true, index: true })
  planId: string;

  @Prop({ required: true, index: true })
  key: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '' })
  tagline: string;

  @Prop({ default: 6 })
  weeks: number;

  @Prop({ default: '4 days / week' })
  frequency: string;

  @Prop({ default: 'All Levels' })
  level: string;

  @Prop({ default: '' })
  targetMuscle: string;

  @Prop({ default: '' })
  image: string;

  @Prop({ default: '#ff5e1a' })
  accentColor: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: [PlanOverviewItemSchema], default: [] })
  overview: PlanOverviewItem[];

  @Prop({ type: [PlanDayScheduleSchema], default: [] })
  schedule: PlanDaySchedule[];
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
