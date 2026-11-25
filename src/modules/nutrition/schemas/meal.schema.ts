import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type MealDocument = HydratedDocument<Meal>;

@Schema({ _id: false })
export class MealMacros {
  @Prop({ required: true, default: 0, min: 0 })
  calories: number;

  @Prop({ required: true, default: 0, min: 0 })
  protein: number;

  @Prop({ required: true, default: 0, min: 0 })
  carbs: number;

  @Prop({ required: true, default: 0, min: 0 })
  fat: number;

  @Prop({ default: 0, min: 0 })
  fiber: number;
}
export const MealMacrosSchema = SchemaFactory.createForClass(MealMacros);

@Schema({ _id: false })
export class MealIngredient {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, default: 0, min: 0 })
  weight: number;

  @Prop({ required: true, default: 'g', trim: true })
  unit: string;
}
export const MealIngredientSchema = SchemaFactory.createForClass(MealIngredient);

/**
 * Meal Recipe Mongoose Schema
 * 
 * Represents a chef-curated macro-calibrated recipe in the Fitnex nutrition library.
 */
@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret: any) => {
      ret.id = ret.mealId || ret._id.toString();
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

  @Prop({ type: MealMacrosSchema, required: true })
  macros: MealMacros;

  @Prop({ type: [MealIngredientSchema], default: [] })
  ingredients: MealIngredient[];

  @Prop({ default: 15, min: 1 })
  prepTime: number;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const MealSchema = SchemaFactory.createForClass(Meal);

// Text index for instant keyword search across name, brief, and category
MealSchema.index({ name: 'text', brief: 'text', category: 'text' });
