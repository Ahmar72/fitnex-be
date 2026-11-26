import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { Exercise, ExerciseDocument } from './schemas/exercise.schema';
import {
  ExerciseFavorite,
  ExerciseFavoriteDocument,
} from './schemas/exercise-favorite.schema';
import {
  ExerciseSortEnum,
  FilterExercisesDto,
} from './dto/filter-exercises.dto';
import { PaginatedExercisesDto } from './dto/exercise-response.dto';
import { ExerciseFacetsDto } from './dto/facets-response.dto';

/**
 * Exercises Catalog Service
 * 
 * Manages the 1,324 movement catalog, facets aggregation, localized instructions,
 * and user bookmarking/favorites. Automatically seeds datasets on startup.
 * Uses canonical MongoDB _id as the sole identifier throughout the platform.
 */
@Injectable()
export class ExercisesService implements OnModuleInit {
  private readonly logger = new Logger(ExercisesService.name);
  private cachedFacets: ExerciseFacetsDto | null = null;
  private readonly legacyMap: Map<string, string> = new Map();

  constructor(
    @InjectModel(Exercise.name)
    public readonly exerciseModel: Model<ExerciseDocument>,
    @InjectModel(ExerciseFavorite.name)
    public readonly favoriteModel: Model<ExerciseFavoriteDocument>,
  ) {
    this.loadLegacyMap();
  }

  private loadLegacyMap() {
    try {
      const candidatePaths = [
        path.resolve(process.cwd(), 'src/common/legacy-exercise-map.json'),
        path.resolve(process.cwd(), 'dist/common/legacy-exercise-map.json'),
        path.resolve(__dirname, '../../common/legacy-exercise-map.json'),
        path.resolve(__dirname, '../../../src/common/legacy-exercise-map.json'),
      ];
      const mapPath = candidatePaths.find((p) => fs.existsSync(p));
      if (mapPath) {
        const raw = fs.readFileSync(mapPath, 'utf8');
        const parsed = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) {
          this.legacyMap.set(k, v as string);
        }
        this.logger.log(`Loaded ${this.legacyMap.size} legacy ID mappings from ${mapPath}`);
      }
    } catch (e: any) {
      this.logger.warn(`Could not load legacy exercise map: ${e.message}`);
    }
  }

  /**
   * Automatically seed exercise data and multi-lingual steps on module initialization
   */
  async onModuleInit() {
    await this.seedExercisesIfEmpty();
  }

  /**
   * Seeds 1,324 exercises and localized steps from JSON files if database is empty
   */
  async seedExercisesIfEmpty() {
    try {
      const count = await this.exerciseModel.countDocuments().exec();
      if (count >= 1324) {
        this.logger.log(`Exercise catalog ready (${count} movements indexed)`);
        return;
      }

      this.logger.log(`Starting seed migration for 1,324 exercise movements...`);
      const candidatePaths = [
        path.resolve(process.cwd(), '../fitnex-fe/public/data/exercises.json'),
        path.resolve(__dirname, '../../../../fitnex-fe/public/data/exercises.json'),
        path.resolve(__dirname, '../../../fitnex-fe/public/data/exercises.json'),
      ];
      const exercisesPath = candidatePaths.find((p) => fs.existsSync(p));

      const candidateSteps = [
        path.resolve(process.cwd(), '../fitnex-fe/public/data/steps'),
        path.resolve(__dirname, '../../../../fitnex-fe/public/data/steps'),
        path.resolve(__dirname, '../../../fitnex-fe/public/data/steps'),
      ];
      const stepsDir = candidateSteps.find((p) => fs.existsSync(p)) || '';

      if (!exercisesPath) {
        this.logger.warn(`Seed file exercises.json not found in candidate paths. Skipping seed.`);
        return;
      }

      const raw = fs.readFileSync(exercisesPath, 'utf8');
      const exercises = JSON.parse(raw);

      const bulkOps = [];
      for (const item of exercises) {
        let i18n = {};
        if (stepsDir) {
          const stepFile = path.join(stepsDir, `${item.id}.json`);
          if (fs.existsSync(stepFile)) {
            try {
              i18n = JSON.parse(fs.readFileSync(stepFile, 'utf8'));
            } catch {
              /* ignore invalid json */
            }
          }
        }

        bulkOps.push({
          updateOne: {
            filter: { name: item.name },
            update: {
              $set: {
                name: item.name,
                bodyPart: (item.bodyPart || '').toLowerCase().trim(),
                equipment: (item.equipment || '').toLowerCase().trim(),
                target: (item.target || '').toLowerCase().trim(),
                muscleGroup: (item.muscleGroup || '').toLowerCase().trim(),
                secondary: item.secondary || [],
                image: item.image || '',
                gif: item.gif || '',
                steps: item.steps || [],
                i18n,
              },
            },
            upsert: true,
          },
        });
      }

      if (bulkOps.length) {
        await this.exerciseModel.bulkWrite(bulkOps, { ordered: false });
        this.cachedFacets = null;
        const finalCount = await this.exerciseModel.countDocuments().exec();
        this.logger.log(
          `Successfully seeded ${finalCount} exercises with localized step guides!`,
        );
      }
    } catch (err: any) {
      this.logger.error(`Exercise seeding failed: ${err.message}`);
    }
  }

  /**
   * Retrieves paginated exercises matching search and taxonomy filter criteria
   */
  async findAll(filterDto: FilterExercisesDto): Promise<PaginatedExercisesDto> {
    const { page = 1, limit = 24, search, bodyPart, target, equipment, sort } = filterDto;
    const query: any = {};

    if (bodyPart) {
      query.bodyPart = bodyPart.toLowerCase().trim();
    }
    if (target) {
      query.target = target.toLowerCase().trim();
    }
    if (equipment) {
      query.equipment = equipment.toLowerCase().trim();
    }
    if (search && search.trim()) {
      const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(term, 'i');
      query.$or = [{ name: regex }, { target: regex }, { bodyPart: regex }, { equipment: regex }];
    }

    const sortOption: any = {};
    if (sort === ExerciseSortEnum.NAME_DESC) {
      sortOption.name = -1;
    } else {
      sortOption.name = 1;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.exerciseModel
        .find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .select('-i18n')
        .exec(),
      this.exerciseModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: items.map((doc) => doc.toJSON() as any),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Retrieves taxonomy aggregation counts across bodyParts, targets, and equipment
   */
  async getFacets(): Promise<ExerciseFacetsDto> {
    if (this.cachedFacets) {
      return this.cachedFacets;
    }

    const [bodyParts, targets, equipment] = await Promise.all([
      this.exerciseModel.aggregate([
        { $group: { _id: '$bodyPart', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, name: '$_id', count: 1 } },
      ]),
      this.exerciseModel.aggregate([
        { $group: { _id: '$target', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, name: '$_id', count: 1 } },
      ]),
      this.exerciseModel.aggregate([
        { $group: { _id: '$equipment', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, name: '$_id', count: 1 } },
      ]),
    ]);

    this.cachedFacets = {
      bodyParts,
      targets,
      equipment,
    };

    return this.cachedFacets;
  }

  /**
   * Retrieves single exercise details including full localized step guides.
   * Resolves by canonical MongoDB ObjectId with fallback support for legacy codes.
   */
  async findById(id: string): Promise<ExerciseDocument> {
    if (Types.ObjectId.isValid(id)) {
      const exercise = await this.exerciseModel.findById(new Types.ObjectId(id)).exec();
      if (exercise) return exercise;
    }

    // Check if legacy code maps to an ObjectId
    const fallbackId = this.legacyMap.get(id);
    if (fallbackId && Types.ObjectId.isValid(fallbackId)) {
      const exercise = await this.exerciseModel.findById(new Types.ObjectId(fallbackId)).exec();
      if (exercise) return exercise;
    }

    throw new NotFoundException(`Exercise with ID "${id}" was not found`);
  }

  /**
   * Retrieves an array of favorited exercise IDs for an authenticated user
   */
  async getUserFavorites(userId: string): Promise<string[]> {
    const favorites = await this.favoriteModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('exerciseId')
      .exec();

    return favorites.map((f) => f.exerciseId.toString());
  }

  /**
   * Toggles the favorite/bookmark state of an exercise for a user
   */
  async toggleFavorite(
    userId: string,
    exerciseId: string,
  ): Promise<{ exerciseId: string; isFavorited: boolean; message: string }> {
    // Verify exercise exists and get its canonical ObjectId
    const exercise = await this.findById(exerciseId);
    const exObjId = exercise._id as Types.ObjectId;

    const userObjId = new Types.ObjectId(userId);
    const existing = await this.favoriteModel
      .findOne({ userId: userObjId, exerciseId: exObjId })
      .exec();

    if (existing) {
      await this.favoriteModel.deleteOne({ _id: existing._id }).exec();
      return {
        exerciseId: exObjId.toString(),
        isFavorited: false,
        message: 'Exercise removed from favorites',
      };
    } else {
      await this.favoriteModel.create({
        userId: userObjId,
        exerciseId: exObjId,
      });
      return {
        exerciseId: exObjId.toString(),
        isFavorited: true,
        message: 'Exercise added to favorites',
      };
    }
  }
}
