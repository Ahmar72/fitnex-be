import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ExerciseDocument = HydratedDocument<Exercise>;

/**
 * Exercise Mongoose Schema
 * 
 * Represents an exercise in the 1,324 movements catalog, including
 * muscle group classifications, equipment, animated assets, and multi-lingual steps.
 */
@Schema({
  collection: 'exercises',
  timestamps: true,
  toJSON: {
    transform: (_, ret: any) => {
      ret.id = ret.exerciseId || ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Exercise extends Document {
  @Prop({ required: true, unique: true, index: true })
  exerciseId: string;

  @Prop({ required: true, index: true, trim: true })
  name: string;

  @Prop({ required: true, index: true, lowercase: true, trim: true })
  bodyPart: string;

  @Prop({ required: true, index: true, lowercase: true, trim: true })
  equipment: string;

  @Prop({ required: true, index: true, lowercase: true, trim: true })
  target: string;

  @Prop({ default: '', lowercase: true, trim: true })
  muscleGroup: string;

  @Prop({ type: [String], default: [] })
  secondary: string[];

  @Prop({ default: '' })
  image: string;

  @Prop({ default: '' })
  gif: string;

  @Prop({ type: [String], default: [] })
  steps: string[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  i18n: Record<string, string[]>;
}

export const ExerciseSchema = SchemaFactory.createForClass(Exercise);

// Compound text index for rapid multi-keyword search
ExerciseSchema.index({ name: 'text', target: 'text', bodyPart: 'text' });
