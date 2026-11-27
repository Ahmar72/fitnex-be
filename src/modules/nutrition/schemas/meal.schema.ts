import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type MealDocument = HydratedDocument<Meal>;

/**
 * Meal Recipe Mongoose Schema
 *
 * Clean, flat meal document with top-level macro fields.
 * Ingredients are stored in the normalized `meal_ingredients` collection.
 */
@Schema({
  collection: 'meals',
  timestamps: true,
  toJSON: {
    transform: (_, ret: any) => {
      ret.id = ret.mealId || ret._id.toString();
      ret.macros = {
        calories: ret.calories ?? 0,
        protein: ret.protein ?? 0,
        carbs: ret.carbs ?? 0,
        fat: ret.fat ?? 0,
        fiber: ret.fiber ?? 0,
      };
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Meal extends Document {
  @Prop({ required: true, unique: true, index: true })
  mealId: string;

  @Prop({ required: true, index: true, trim: true })
  name: string;

  @Prop({ required: true, index: true, lowercase: true, trim: true })
  category: string;

  @Prop({ type: [String], default: [], index: true })
  goal: string[];

  @Prop({ type: [String], default: [] })
  targetMuscles: string[];

  @Prop({ default: '' })
  brief: string;

  @Prop({ default: '' })
  image: string;

  @Prop({ required: true, default: 0, min: 0, index: true })
  calories: number;

  @Prop({ required: true, default: 0, min: 0, index: true })
  protein: number;

  @Prop({ required: true, default: 0, min: 0 })
  carbs: number;

  @Prop({ required: true, default: 0, min: 0 })
  fat: number;

  @Prop({ default: 0, min: 0 })
  fiber: number;

  @Prop({ default: 15, min: 1 })
  prepTime: number;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const MealSchema = SchemaFactory.createForClass(Meal);

// Text index for instant keyword search across name, brief, and category
MealSchema.index({ name: 'text', brief: 'text', category: 'text' });
