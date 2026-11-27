import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type MealIngredientDocument = HydratedDocument<MealIngredient>;

/**
 * Meal Ingredient Mongoose Schema
 *
 * Normalized collection representing individual ingredients of a meal recipe.
 */
@Schema({
  collection: 'meal_ingredients',
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
export class MealIngredient extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Meal', required: true, index: true })
  mealId: Types.ObjectId;

  @Prop({ required: true, index: true })
  mealSlug: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  weight: string;

  @Prop({ default: '' })
  unit: string;

  @Prop({ default: 0 })
  order: number;
}

export const MealIngredientSchema = SchemaFactory.createForClass(MealIngredient);
MealIngredientSchema.index({ mealId: 1, order: 1 });
