import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type PersonalRecordDocument = HydratedDocument<PersonalRecord>;

/**
 * Personal Record Mongoose Schema
 * 
 * Tracks all-time maximum single-set weight and maximum session volume per exercise per user.
 */
@Schema({
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
export class PersonalRecord extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  exerciseId: string;

  @Prop({ required: true, trim: true })
  exerciseName: string;

  @Prop({ required: true, default: 0, min: 0 })
  maxWeight: number;

  @Prop({ default: 0, min: 0 })
  maxVolume: number;

  @Prop({ default: 1, min: 1 })
  repsAtMaxWeight: number;

  @Prop({ default: () => new Date() })
  achievedAt: Date;
}

export const PersonalRecordSchema = SchemaFactory.createForClass(PersonalRecord);

// Unique compound index: a user has exactly one PersonalRecord document per exercise
PersonalRecordSchema.index({ userId: 1, exerciseId: 1 }, { unique: true });
