import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type UserMealFavoriteDocument = HydratedDocument<UserMealFavorite>;

/**
 * User Meal Favorite Mongoose Schema
 * 
 * Stores the bookmarked recipes for authenticated users.
 */
@Schema({
  collection: 'user_meal_favorites',
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
export class UserMealFavorite extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  mealId: string;
}

export const UserMealFavoriteSchema = SchemaFactory.createForClass(UserMealFavorite);

// Compound unique index ensuring a user can only favorite a meal once
UserMealFavoriteSchema.index({ userId: 1, mealId: 1 }, { unique: true });
