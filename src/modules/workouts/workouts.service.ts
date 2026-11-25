import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workout, WorkoutDocument } from './schemas/workout.schema';
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
 * and live workout builder state synchronization.
 */
@Injectable()
export class WorkoutsService {
  constructor(
    @InjectModel(Workout.name)
    private readonly workoutModel: Model<WorkoutDocument>,
    private readonly exercisesService: ExercisesService,
  ) {}

  /**
   * Generates a unique client-compatible ID
   */
  private generateUid(prefix = 'fx'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
    const workout = await this.workoutModel
      .findOneAndUpdate(
        { userId: userObjId, isTemplate: false },
        {
          $set: {
            name: dto.name,
            items: dto.items,
          },
        },
        { new: true, upsert: true },
      )
      .exec();

    return workout;
  }

  /**
   * Appends an exercise item to the current workout draft
   */
  async addItem(userId: string, dto: AddWorkoutItemDto): Promise<WorkoutDocument> {
    // Verify exercise exists
    const exercise = await this.exercisesService.findById(dto.exerciseId);

    const defaultWeight = exercise.equipment === 'body weight' ? 0 : 20;
    const setsCount = dto.sets || 3;
    const reps = dto.reps || 10;
    const weight = typeof dto.weight === 'number' ? dto.weight : defaultWeight;

    const newItem = {
      uid: this.generateUid('item'),
      exerciseId: dto.exerciseId,
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

    return workout;
  }

  /**
   * Loads a pre-configured routine template into the builder
   */
  async loadRoutine(userId: string, dto: LoadRoutineDto): Promise<WorkoutDocument> {
    const items = [];

    for (const entry of dto.list) {
      let defaultWeight = 20;
      try {
        const ex = await this.exercisesService.findById(entry.id);
        if (ex && ex.equipment === 'body weight') {
          defaultWeight = 0;
        }
      } catch {
        /* fallback to default */
      }

      const setsCount = entry.sets || 3;
      const reps = entry.reps || 10;
      const weight = typeof entry.weight === 'number' ? entry.weight : defaultWeight;

      items.push({
        uid: this.generateUid('item'),
        exerciseId: entry.id,
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

    return workout;
  }
}
