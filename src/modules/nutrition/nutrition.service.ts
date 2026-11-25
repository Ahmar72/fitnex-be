import {
  Injectable,
  NotFoundException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';
import { Meal, MealDocument } from './schemas/meal.schema';
import {
  UserMealFavorite,
  UserMealFavoriteDocument,
} from './schemas/user-meal-favorite.schema';
import {
  UserMealLog,
  UserMealLogDocument,
} from './schemas/user-meal-log.schema';
import { FilterMealsDto, LogMealDto } from './dto/nutrition-dtos';
import { OnboardingService } from '../onboarding/onboarding.service';

export const MEAL_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
  { key: 'pre-workout', label: 'Pre-Workout' },
  { key: 'post-workout', label: 'Post-Workout' },
];

/**
 * Nutrition & Meal Tracker Service
 * 
 * Manages the recipe catalog, user meal favorites, food logging,
 * and daily macronutrient and caloric progress tracking.
 */
@Injectable()
export class NutritionService implements OnModuleInit {
  private readonly logger = new Logger(NutritionService.name);

  constructor(
    @InjectModel(Meal.name)
    private readonly mealModel: Model<MealDocument>,
    @InjectModel(UserMealFavorite.name)
    private readonly userMealFavoriteModel: Model<UserMealFavoriteDocument>,
    @InjectModel(UserMealLog.name)
    private readonly userMealLogModel: Model<UserMealLogDocument>,
    private readonly onboardingService: OnboardingService,
  ) {}

  /**
   * Automatically seed 52 chef-curated macro-calibrated meals if database has fewer than 52 meals.
   */
  async onModuleInit() {
    try {
      const count = await this.mealModel.countDocuments();
      if (count < 52) {
        this.logger.log(`Seeding recipes (current count: ${count})...`);
        const possiblePaths = [
          path.join(__dirname, 'data', 'meals-seed.json'),
          path.join(process.cwd(), 'src', 'modules', 'nutrition', 'data', 'meals-seed.json'),
          path.join(process.cwd(), 'dist', 'modules', 'nutrition', 'data', 'meals-seed.json'),
        ];

        let seedFile: string | null = null;
        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            seedFile = p;
            break;
          }
        }

        if (seedFile) {
          const rawData = fs.readFileSync(seedFile, 'utf8');
          const parsed = JSON.parse(rawData);
          const mealsData: any[] = Array.isArray(parsed) ? parsed : (parsed.meals || []);

          const operations = mealsData.map((m) => ({
            updateOne: {
              filter: { mealId: m.id },
              update: {
                $set: {
                  mealId: m.id,
                  name: m.name,
                  category: m.category,
                  goal: Array.isArray(m.goal) ? m.goal : [m.goal],
                  targetMuscles: Array.isArray(m.targetMuscles) ? m.targetMuscles : [],
                  image: m.image || '',
                  prepTimeMinutes: Number(m.prepTime) || 20,
                  servings: Number(m.servings) || 1,
                  difficulty: m.difficulty || 'medium',
                  description: m.description || '',
                  macros: {
                    calories: Number(m.macros?.calories) || 0,
                    protein: Number(m.macros?.protein) || 0,
                    carbs: Number(m.macros?.carbs) || 0,
                    fat: Number(m.macros?.fat) || 0,
                    fiber: Number(m.macros?.fiber) || 0,
                  },
                  ingredients: Array.isArray(m.ingredients)
                    ? m.ingredients.map((ing: any) => ({
                        name: ing.name || String(ing),
                        weight: Number(ing.weight) || 100,
                        unit: ing.unit || 'g',
                      }))
                    : [],
                  instructions: Array.isArray(m.instructions) ? m.instructions : [],
                  chefTips: m.chefTips || '',
                  isFeatured: Boolean(m.isFeatured),
                },
              },
              upsert: true,
            },
          }));

          await this.mealModel.bulkWrite(operations);
          this.logger.log(`Successfully seeded ${mealsData.length} meal recipes.`);
        } else {
          this.logger.warn('Meal seed file not found in search paths.');
        }
      }
    } catch (err: any) {
      this.logger.error(`Error during meal seeding: ${err.message}`, err.stack);
    }
  }

  /**
   * Retrieves meal categories
   */
  getCategories(): { key: string; label: string }[] {
    return MEAL_CATEGORIES;
  }

  /**
   * Filters and returns paginated meals
   */
  async findAll(filterDto: FilterMealsDto) {
    const page = Math.max(1, Number(filterDto.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filterDto.limit) || 24));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (filterDto.category && filterDto.category.toLowerCase() !== 'all') {
      filter.category = filterDto.category.toLowerCase().trim();
    }

    if (filterDto.goal && filterDto.goal.toLowerCase() !== 'all') {
      filter.goal = filterDto.goal.toLowerCase().trim();
    }

    if (filterDto.search && filterDto.search.trim()) {
      const escaped = filterDto.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
        { targetMuscles: { $regex: escaped, $options: 'i' } },
      ];
    }

    let sortOption: Record<string, 1 | -1> = { name: 1 };
    if (filterDto.sort === 'calories_asc') {
      sortOption = { 'macros.calories': 1 };
    } else if (filterDto.sort === 'calories_desc') {
      sortOption = { 'macros.calories': -1 };
    } else if (filterDto.sort === 'protein_desc') {
      sortOption = { 'macros.protein': -1 };
    }

    const [meals, total] = await Promise.all([
      this.mealModel.find(filter).sort(sortOption).skip(skip).limit(limit).exec(),
      this.mealModel.countDocuments(filter).exec(),
    ]);

    return {
      meals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves single recipe by ID (mealId or _id)
   */
  async findById(id: string): Promise<MealDocument> {
    let meal: MealDocument | null = null;
    if (Types.ObjectId.isValid(id)) {
      meal = await this.mealModel.findById(id).exec();
    }
    if (!meal) {
      meal = await this.mealModel.findOne({ mealId: id }).exec();
    }

    if (!meal) {
      throw new NotFoundException(`Recipe with ID "${id}" was not found.`);
    }

    return meal;
  }

  /**
   * Retrieves list of favorited meal IDs for user
   */
  async getFavorites(userId: string): Promise<string[]> {
    const favorites = await this.userMealFavoriteModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('mealId')
      .exec();

    return favorites.map((f) => f.mealId);
  }

  /**
   * Toggles bookmark / favorite for a meal recipe
   */
  async toggleFavorite(
    userId: string,
    mealId: string,
  ): Promise<{ mealId: string; isFavorite: boolean; message: string }> {
    const existing = await this.userMealFavoriteModel
      .findOne({
        userId: new Types.ObjectId(userId),
        mealId,
      })
      .exec();

    if (existing) {
      await this.userMealFavoriteModel.deleteOne({ _id: existing._id }).exec();
      return {
        mealId,
        isFavorite: false,
        message: 'Recipe removed from your favorites.',
      };
    }

    await this.userMealFavoriteModel.create({
      userId: new Types.ObjectId(userId),
      mealId,
    });

    return {
      mealId,
      isFavorite: true,
      message: 'Recipe saved to your favorites.',
    };
  }

  /**
   * Logs a meal consumed by the user
   */
  async logMeal(userId: string, dto: LogMealDto): Promise<UserMealLogDocument> {
    const servings = Math.max(0.1, Number(dto.servings) || 1);
    const dateKey = dto.dateKey || new Date().toISOString().split('T')[0];

    let name = dto.name;
    let category = dto.category || 'snack';
    let calories = Number(dto.calories);
    let protein = Number(dto.protein);
    let carbs = Number(dto.carbs);
    let fat = Number(dto.fat);

    // If mealId is provided and macros were omitted or 0, load from catalog
    if (dto.mealId && (!calories || isNaN(calories))) {
      try {
        const recipe = await this.findById(dto.mealId);
        name = name || recipe.name;
        category = category || recipe.category;
        calories = Math.round(recipe.macros.calories * servings);
        protein = Math.round(recipe.macros.protein * servings);
        carbs = Math.round(recipe.macros.carbs * servings);
        fat = Math.round(recipe.macros.fat * servings);
      } catch (err) {
        // Fall back to provided values
      }
    }

    const created = await this.userMealLogModel.create({
      userId: new Types.ObjectId(userId),
      mealId: dto.mealId || null,
      name: name || 'Logged Meal',
      category: category || 'snack',
      dateKey,
      calories: Math.round((calories || 0) * (dto.mealId && calories ? 1 : servings)),
      protein: Math.round((protein || 0) * (dto.mealId && protein ? 1 : servings)),
      carbs: Math.round((carbs || 0) * (dto.mealId && carbs ? 1 : servings)),
      fat: Math.round((fat || 0) * (dto.mealId && fat ? 1 : servings)),
      servings,
      loggedAt: new Date(),
    });

    return created;
  }

  /**
   * Retrieves meal logs for a specific user and date
   */
  async getLogs(userId: string, dateKey?: string): Promise<UserMealLogDocument[]> {
    const targetDate = dateKey || new Date().toISOString().split('T')[0];
    return this.userMealLogModel
      .find({
        userId: new Types.ObjectId(userId),
        dateKey: targetDate,
      })
      .sort({ loggedAt: -1 })
      .exec();
  }

  /**
   * Deletes a user meal log entry
   */
  async deleteLog(userId: string, logId: string): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(logId)) {
      throw new NotFoundException('Invalid log ID.');
    }

    const result = await this.userMealLogModel
      .deleteOne({
        _id: new Types.ObjectId(logId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Meal log entry not found or unauthorized.');
    }

    return {
      success: true,
      message: 'Meal entry successfully removed.',
    };
  }

  /**
   * Calculates daily consumed macros vs metabolic targets
   */
  async getDailySummary(userId: string, dateKey?: string) {
    const targetDate = dateKey || new Date().toISOString().split('T')[0];

    const logs = await this.getLogs(userId, targetDate);

    const consumed = {
      calories: logs.reduce((sum, log) => sum + (log.calories || 0), 0),
      protein: logs.reduce((sum, log) => sum + (log.protein || 0), 0),
      carbs: logs.reduce((sum, log) => sum + (log.carbs || 0), 0),
      fat: logs.reduce((sum, log) => sum + (log.fat || 0), 0),
    };

    // Retrieve onboarding metabolic targets
    let targets = {
      calories: 2200,
      protein: 150,
      carbs: 250,
      fat: 65,
    };

    try {
      const profile = await this.onboardingService.getProfile(userId);
      if (profile) {
        targets = {
          calories: profile.targetCalories || 2200,
          protein: profile.targetProteinGrams || 150,
          carbs: profile.targetCarbsGrams || 250,
          fat: profile.targetFatGrams || 65,
        };
      }
    } catch {
      // Default fallback when user hasn't finished onboarding yet
    }

    const remaining = {
      calories: Math.max(0, targets.calories - consumed.calories),
      protein: Math.max(0, targets.protein - consumed.protein),
      carbs: Math.max(0, targets.carbs - consumed.carbs),
      fat: Math.max(0, targets.fat - consumed.fat),
    };

    const percentage = {
      calories: Math.min(100, Math.round((consumed.calories / (targets.calories || 1)) * 100)),
      protein: Math.min(100, Math.round((consumed.protein / (targets.protein || 1)) * 100)),
      carbs: Math.min(100, Math.round((consumed.carbs / (targets.carbs || 1)) * 100)),
      fat: Math.min(100, Math.round((consumed.fat / (targets.fat || 1)) * 100)),
    };

    return {
      dateKey: targetDate,
      consumed,
      targets,
      remaining,
      percentage,
      logsCount: logs.length,
    };
  }
}
