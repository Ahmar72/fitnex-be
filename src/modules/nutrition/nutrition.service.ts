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
  MealIngredient,
  MealIngredientDocument,
} from './schemas/meal-ingredient.schema';
import { FilterMealsDto } from './dto/nutrition-dtos';

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
 * Nutrition & Recipe Catalog Service
 * 
 * Manages the recipe catalog, category discovery,
 * and individual recipe details.
 */
@Injectable()
export class NutritionService implements OnModuleInit {
  private readonly logger = new Logger(NutritionService.name);

  constructor(
    @InjectModel(Meal.name)
    private readonly mealModel: Model<MealDocument>,
    @InjectModel(MealIngredient.name)
    private readonly ingredientModel: Model<MealIngredientDocument>,
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
      sortOption = { calories: 1 };
    } else if (filterDto.sort === 'calories_desc') {
      sortOption = { calories: -1 };
    } else if (filterDto.sort === 'protein_desc') {
      sortOption = { protein: -1 };
    }

    const [mealDocs, total] = await Promise.all([
      this.mealModel.find(filter).sort(sortOption).skip(skip).limit(limit).exec(),
      this.mealModel.countDocuments(filter).exec(),
    ]);

    const meals = await this.attachIngredients(mealDocs);

    return {
      meals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Assembles normalized meal_ingredients onto meal documents
   */
  private async attachIngredients(meals: MealDocument[]): Promise<any[]> {
    if (!meals.length) return [];
    const mealIds = meals.map((m) => m._id);
    const allIngs = await this.ingredientModel
      .find({ mealId: { $in: mealIds } })
      .sort({ order: 1 })
      .exec();

    const ingMap = new Map<string, any[]>();
    for (const ing of allIngs) {
      const k = ing.mealId.toString();
      if (!ingMap.has(k)) ingMap.set(k, []);
      ingMap.get(k)!.push({
        name: ing.name,
        weight: ing.weight,
        unit: ing.unit,
      });
    }

    return meals.map((m) => ({
      ...m.toJSON(),
      ingredients: ingMap.get(m._id.toString()) || [],
    }));
  }

  /**
   * Retrieves single recipe by ID (mealId or _id)
   */
  async findById(id: string): Promise<any> {
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

    const [assembled] = await this.attachIngredients([meal]);
    return assembled;
  }
}
