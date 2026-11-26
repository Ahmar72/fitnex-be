import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type OnboardingProfileDocument = HydratedDocument<OnboardingProfile>;

/**
 * User Onboarding & Metabolic Profile Schema
 * 
 * Stores user fitness goals, physical statistics, activity tier,
 * calculated BMR, TDEE, and daily caloric and macronutrient targets.
 */
@Schema({
  collection: 'onboarding_profiles',
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
export class OnboardingProfile extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ default: 'muscle', enum: ['muscle', 'fat', 'strength', 'fit'] })
  goal: string;

  @Prop({ default: 'beginner', enum: ['beginner', 'intermediate', 'advanced'] })
  level: string;

  @Prop({ default: 3, min: 1, max: 7 })
  daysPerWeek: number;

  @Prop({ default: 'muscle-building' })
  planId: string;

  @Prop({ default: 25, min: 10, max: 120 })
  age: number;

  @Prop({ default: 'male', enum: ['male', 'female'] })
  sex: string;

  @Prop({ default: 70 })
  weight: number;

  @Prop({ default: 'kg', enum: ['kg', 'lbs'] })
  weightUnit: string;

  @Prop({ default: 70 })
  weightKg: number;

  @Prop({ default: 170 })
  height: number;

  @Prop({ default: 'cm', enum: ['cm', 'ft'] })
  heightUnit: string;

  @Prop({ default: 170 })
  heightCm: number;

  @Prop({
    default: 'moderate',
    enum: ['sedentary', 'light', 'moderate', 'very_active', 'extra_active'],
  })
  activityLevel: string;

  @Prop({ default: 'maintain', enum: ['loss', 'maintain', 'gain'] })
  dietGoal: string;

  @Prop({ required: true })
  bmr: number;

  @Prop({ required: true })
  tdee: number;

  @Prop({ required: true })
  targetCalories: number;

  @Prop({ required: true })
  targetProteinGrams: number;

  @Prop({ required: true })
  targetCarbsGrams: number;

  @Prop({ required: true })
  targetFatGrams: number;

  @Prop({ default: true })
  isCompleted: boolean;
}

export const OnboardingProfileSchema = SchemaFactory.createForClass(OnboardingProfile);
