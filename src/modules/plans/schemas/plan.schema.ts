import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type PlanDocument = HydratedDocument<Plan>;

/**
 * Plan Mongoose Schema
 *
 * Clean, flat training plan header. Overview metrics and daily schedules
 * are stored in `plan_overviews` and `plan_schedules`.
 */
@Schema({
  collection: 'plans',
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
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
