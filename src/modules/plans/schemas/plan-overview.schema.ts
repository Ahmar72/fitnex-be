import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type PlanOverviewDocument = HydratedDocument<PlanOverview>;

/**
 * Plan Overview Mongoose Schema
 *
 * Normalized collection for training plan overview key-value metrics.
 */
@Schema({
  collection: 'plan_overviews',
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
export class PlanOverview extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Plan', required: true, index: true })
  planId: Types.ObjectId;

  @Prop({ required: true, index: true })
  planSlug: string;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  value: string;

  @Prop({ default: 0 })
  order: number;
}

export const PlanOverviewSchema = SchemaFactory.createForClass(PlanOverview);
PlanOverviewSchema.index({ planId: 1, order: 1 });
