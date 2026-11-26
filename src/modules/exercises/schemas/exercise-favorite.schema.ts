import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type ExerciseFavoriteDocument = HydratedDocument<ExerciseFavorite>;

/**
 * Exercise Favorite Mongoose Schema
 * 
 * Records an individual user's bookmark/favorite relationship with an exercise,
 * referencing the exercise's canonical MongoDB ObjectId.
 */
@Schema({
  collection: 'exercise_favorites',
  timestamps: true,
  toJSON: {
    transform: (_, ret: any) => {
      ret.id = ret._id.toString();
      ret.exerciseId = ret.exerciseId?.toString() || ret.exerciseId;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class ExerciseFavorite extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Exercise', required: true, index: true })
  exerciseId: Types.ObjectId;
}

export const ExerciseFavoriteSchema = SchemaFactory.createForClass(ExerciseFavorite);

// Compound unique index ensuring a user can only favorite an exercise once
ExerciseFavoriteSchema.index({ userId: 1, exerciseId: 1 }, { unique: true });
