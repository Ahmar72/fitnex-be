import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type ExerciseTranslationDocument = HydratedDocument<ExerciseTranslation>;

/**
 * Exercise Translation Mongoose Schema
 *
 * Normalized collection storing localized step-by-step instructions per exercise and language.
 */
@Schema({
  collection: 'exercise_translations',
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
export class ExerciseTranslation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Exercise', required: true, index: true })
  exerciseId: Types.ObjectId;

  @Prop({ required: true, index: true })
  language: string;

  @Prop({ type: [String], default: [] })
  steps: string[];
}

export const ExerciseTranslationSchema = SchemaFactory.createForClass(ExerciseTranslation);
ExerciseTranslationSchema.index({ exerciseId: 1, language: 1 }, { unique: true });
