import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workout, WorkoutDocument } from './schemas/workout.schema';
import {
  WorkoutItemEntity,
  WorkoutItemEntityDocument,
} from './schemas/workout-item-entity.schema';
import {
  AddWorkoutItemDto,
  LoadRoutineDto,
  UpdateWorkoutDto,
} from './dto/update-workout.dto';
import { ExercisesService } from '../exercises/exercises.service';

/**
 * Workouts Builder Service
 * 
 * Manages user's active workout draft, set progressions, routine templates,
 * live workout builder state synchronization, and normalized workout_items persistence.
 */
@Injectable()
export class WorkoutsService {
  constructor(
    @InjectModel(Workout.name)
    private readonly workoutModel: Model<WorkoutDocument>,
    @InjectModel(WorkoutItemEntity.name)
    private readonly itemEntityModel: Model<WorkoutItemEntityDocument>,
    private readonly exercisesService: ExercisesService,
  ) {}

  /**
   * Generates a unique client-compatible ID
   */
  private generateUid(prefix = 'fx'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Syncs normalized workout_items collection for a workout
   */
  private async syncWorkoutItems(workout: WorkoutDocument, userId: Types.ObjectId): Promise<void> {
    try {
      await this.itemEntityModel.deleteMany({ workoutId: workout._id });
      if (Array.isArray(workout.items) && workout.items.length > 0) {
        const itemDocs = workout.items.map((item) => ({
          workoutId: workout._id,
          userId,
          exerciseId: item.exerciseId,
          uid: item.uid,
          sets: item.sets || [],
        }));
        await this.itemEntityModel.insertMany(itemDocs);
      }
    } catch {
      /* non-blocking background sync */
    }
  }

  /**
   * Retrieves user's active workout builder draft, initializing one if empty
   */
  async getCurrentWorkout(userId: string): Promise<WorkoutDocument> {
    const userObjId = new Types.ObjectId(userId);
    let workout = await this.workoutModel
      .findOne({ userId: userObjId, isTemplate: false })
      .exec();

    if (!workout) {
      workout = await this.workoutModel.create({
        userId: userObjId,
        name: 'My Workout',
        items: [],
        isTemplate: false,
      });
    }

    return workout;
  }

  /**
   * Overwrites/saves the entire active builder workout state
   */
  async saveCurrentWorkout(
    userId: string,
    dto: UpdateWorkoutDto,
  ): Promise<WorkoutDocument> {
    const userObjId = new Types.ObjectId(userId);
    const resolvedItems = [];

    if (Array.isArray(dto.items)) {
      for (const item of dto.items) {
        let exId = item.exerciseId;
        try {
          const ex = await this.exercisesService.findById(item.exerciseId);
          if (ex) {
            exId = (ex._id as Types.ObjectId).toString();
          }
        } catch {
          /* keep current if already valid */
        }
        resolvedItems.push({
          uid: item.uid || this.generateUid('item'),
          exerciseId: exId,
          sets: item.sets || [],
        });
      }
    }

    const workout = await this.workoutModel
      .findOneAndUpdate(
        { userId: userObjId, isTemplate: false },
        {
          $set: {
            name: dto.name,
            items: resolvedItems,
          },
        },
        { new: true, upsert: true },
      )
      .exec();

    await this.syncWorkoutItems(workout, userObjId);
    return workout;
  }

  /**
   * Appends an exercise item to the current workout draft
   */
  async addItem(userId: string, dto: AddWorkoutItemDto): Promise<WorkoutDocument> {
    // Verify exercise exists and resolve canonical ObjectId
    const exercise = await this.exercisesService.findById(dto.exerciseId);
    const exObjId = (exercise._id as Types.ObjectId).toString();

    const defaultWeight = exercise.equipment === 'body weight' ? 0 : 20;
    const setsCount = dto.sets || 3;
    const reps = dto.reps || 10;
    const weight = typeof dto.weight === 'number' ? dto.weight : defaultWeight;

    const newItem = {
      uid: this.generateUid('item'),
      exerciseId: exObjId,
      sets: Array.from({ length: setsCount }, () => ({
        id: this.generateUid('set'),
        reps,
        weight,
        done: false,
      })),
    };

    const userObjId = new Types.ObjectId(userId);
    const workout = await this.workoutModel
      .findOneAndUpdate(
        { userId: userObjId, isTemplate: false },
        {
          $push: { items: newItem },
        },
        { new: true, upsert: true },
      )
      .exec();

    await this.syncWorkoutItems(workout, userObjId);
    return workout;
  }

  /**
   * Removes an item by UID from the current workout draft
   */
  async removeItem(userId: string, itemId: string): Promise<WorkoutDocument> {
    const userObjId = new Types.ObjectId(userId);
    const workout = await this.workoutModel
      .findOneAndUpdate(
        { userId: userObjId, isTemplate: false },
        {
          $pull: { items: { uid: itemId } },
        },
        { new: true },
      )
      .exec();

    if (!workout) {
      throw new NotFoundException('Active workout not found');
    }

    await this.syncWorkoutItems(workout, userObjId);
    return workout;
  }

  /**
   * Loads a pre-configured routine template into the builder
   */
  async loadRoutine(userId: string, dto: LoadRoutineDto): Promise<WorkoutDocument> {
    const items = [];

    for (const entry of dto.list) {
      let defaultWeight = 20;
      let exObjId = entry.id;
      try {
        const ex = await this.exercisesService.findById(entry.id);
        if (ex) {
          exObjId = (ex._id as Types.ObjectId).toString();
          if (ex.equipment === 'body weight') {
            defaultWeight = 0;
          }
        }
      } catch {
        /* fallback to default */
      }

      const setsCount = entry.sets || 3;
      const reps = entry.reps || 10;
      const weight = typeof entry.weight === 'number' ? entry.weight : defaultWeight;

      items.push({
        uid: this.generateUid('item'),
        exerciseId: exObjId,
        sets: Array.from({ length: setsCount }, () => ({
          id: this.generateUid('set'),
          reps,
          weight,
          done: false,
        })),
      });
    }

    const userObjId = new Types.ObjectId(userId);
    const workout = await this.workoutModel
      .findOneAndUpdate(
        { userId: userObjId, isTemplate: false },
        {
          $set: {
            name: dto.name,
            items,
          },
        },
        { new: true, upsert: true },
      )
      .exec();

    await this.syncWorkoutItems(workout, userObjId);
    return workout;
  }
}
