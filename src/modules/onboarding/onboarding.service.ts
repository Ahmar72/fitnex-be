import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OnboardingProfile, OnboardingProfileDocument } from './schemas/onboarding-profile.schema';
import {
  CalculateCaloriesDto,
  HeightUnitEnum,
  SexEnum,
  WeightUnitEnum,
} from './dto/calculate-calories.dto';
import { SaveOnboardingDto } from './dto/save-onboarding.dto';
import { CalorieResponseDto } from './dto/calorie-response.dto';

/**
 * Onboarding & Metabolic Engine Service
 * 
 * Implements the Mifflin-St Jeor formula for Basal Metabolic Rate (BMR),
 * Total Daily Energy Expenditure (TDEE), and macronutrient distribution.
 * Manages onboarding profile persistence in MongoDB.
 */
@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel(OnboardingProfile.name)
    private readonly onboardingProfileModel: Model<OnboardingProfileDocument>,
  ) {}

  /**
   * Calculates BMR, TDEE, goal-adjusted calorie target, and macronutrients
   */
  calculateMetabolism(dto: CalculateCaloriesDto): CalorieResponseDto {
    const age = Number(dto.age) || 25;
    const sex = dto.sex || SexEnum.MALE;

    // Normalize weight to kilograms
    let weightKg = Number(dto.weight) || 70;
    if (dto.weightUnit === WeightUnitEnum.LBS) {
      weightKg = Math.round((weightKg / 2.20462) * 10) / 10;
    } else {
      weightKg = Math.round(weightKg * 10) / 10;
    }

    // Normalize height to centimeters
    let heightCm = Number(dto.height) || 170;
    if (dto.heightUnit === HeightUnitEnum.FT) {
      const feet = Number(dto.heightFeet) || 5;
      const inches = Number(dto.heightInches) || 7;
      heightCm = Math.round((feet * 12 + inches) * 2.54);
    }

    // Mifflin-St Jeor formula
    // Men: BMR = (10 * weight in kg) + (6.25 * height in cm) - (5 * age) + 5
    // Women: BMR = (10 * weight in kg) + (6.25 * height in cm) - (5 * age) - 161
    const genderConstant = sex === SexEnum.MALE ? 5 : -161;
    let bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + genderConstant);

    // Activity Multiplier
    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725,
      extra_active: 1.9,
    };
    const multiplier = multipliers[dto.activityLevel] || 1.55;
    const tdee = Math.round(bmr * multiplier);

    // Goal-tailored adjustment:
    // Loss: -500 kcal deficit (minimum 1,200 kcal floor for safety)
    // Gain: +350 kcal surplus
    // Maintain: equal to TDEE
    let targetCalories = tdee;
    const dietGoal = dto.dietGoal || 'maintain';

    if (dietGoal === 'loss') {
      targetCalories = Math.max(1200, Math.round(tdee - 500));
    } else if (dietGoal === 'gain') {
      targetCalories = Math.round(tdee + 350);
    } else {
      targetCalories = tdee;
    }

    // Macronutrient breakdown:
    // 30% Protein (4 kcal/g), 40% Carbohydrates (4 kcal/g), 30% Fat (9 kcal/g)
    const protein = Math.round((targetCalories * 0.3) / 4);
    const carbs = Math.round((targetCalories * 0.4) / 4);
    const fat = Math.round((targetCalories * 0.3) / 9);

    return {
      bmr,
      tdee,
      targetCalories,
      weightKg,
      heightCm,
      macros: {
        protein,
        carbs,
        fat,
      },
    };
  }

  /**
   * Saves or updates the authenticated user's onboarding profile and targets
   */
  async saveOnboarding(
    userId: string,
    dto: SaveOnboardingDto,
  ): Promise<OnboardingProfileDocument> {
    const calc = this.calculateMetabolism(dto);

    const profileData = {
      userId: new Types.ObjectId(userId),
      goal: dto.goal,
      level: dto.level,
      daysPerWeek: dto.daysPerWeek,
      planId: dto.planId || `${dto.goal}-starter`,
      age: dto.age,
      sex: dto.sex,
      weight: dto.weight,
      weightUnit: dto.weightUnit,
      weightKg: calc.weightKg,
      height: dto.height,
      heightUnit: dto.heightUnit,
      heightCm: calc.heightCm,
      activityLevel: dto.activityLevel,
      dietGoal: dto.dietGoal || 'maintain',
      bmr: calc.bmr,
      tdee: calc.tdee,
      targetCalories: calc.targetCalories,
      targetProteinGrams: calc.macros.protein,
      targetCarbsGrams: calc.macros.carbs,
      targetFatGrams: calc.macros.fat,
      isCompleted: true,
    };

    const profile = await this.onboardingProfileModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: profileData },
        { new: true, upsert: true },
      )
      .exec();

    return profile;
  }

  /**
   * Retrieves onboarding profile by userId
   */
  async getProfile(userId: string): Promise<OnboardingProfileDocument> {
    const profile = await this.onboardingProfileModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (!profile) {
      throw new NotFoundException('Onboarding profile not found for this user');
    }

    return profile;
  }
}
