import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workout, WorkoutDocument } from './schemas/workout.schema';
import {
  WorkoutItemEntity,
  WorkoutItemEntityDocument,
} from './schemas/workout-item-entity.schema';
import {
  WorkoutItemSet,
  WorkoutItemSetDocument,
} from './schemas/workout-item-set.schema';
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
 * and normalized persistence across `workouts`, `workout_items`, and `workout_item_sets`.
 */
@Injectable()
export class WorkoutsService {
  constructor(
    @InjectModel(Workout.name)
    private readonly workoutModel: Model<WorkoutDocument>,
    @InjectModel(WorkoutItemEntity.name)
    private readonly itemEntityModel: Model<WorkoutItemEntityDocument>,
    @InjectModel(WorkoutItemSet.name)
    private readonly itemSetModel: Model<WorkoutItemSetDocument>,
    private readonly exercisesService: ExercisesService,
  ) {}

  private generateUid(prefix = 'fx'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Assembles normalized workout_items and workout_item_sets into the API shape
   */
  private async assembleWorkout(workout: WorkoutDocument): Promise<any> {
    const itemDocs = await this.itemEntityModel
      .find({ workoutId: workout._id })
      .sort({ order: 1, createdAt: 1 })
      .exec();

    const setDocs = itemDocs.length
      ? await this.itemSetModel
          .find({ workoutId: workout._id })
          .sort({ setNumber: 1 })
          .exec()
      : [];

    const setsByItem = new Map<string, any[]>();
    for (const s of setDocs) {
      const key = s.workoutItemId.toString();
      if (!setsByItem.has(key)) setsByItem.set(key, []);
      setsByItem.get(key)!.push({
        id: s.setId,
        reps: s.reps,
        weight: s.weight,
        done: s.done,
      });
    }

    const items = itemDocs.map((item) => ({
      uid: item.uid,
      exerciseId: item.exerciseId.toString(),
      sets: setsByItem.get(item._id.toString()) || [],
    }));

    return {
      ...workout.toJSON(),
      items,
    };
  }

  /**
   * Replaces normalized workout_items and workout_item_sets for a workout
   */
  private async replaceWorkoutItems(
    workout: WorkoutDocument,
    userId: Types.ObjectId,
    items: Array<{ uid: string; exerciseId: string; sets: any[] }>,
  ): Promise<void> {
    await Promise.all([
      this.itemEntityModel.deleteMany({ workoutId: workout._id }).exec(),
      this.itemSetModel.deleteMany({ workoutId: workout._id }).exec(),
    ]);

    if (!items.length) return;

    const itemPayloads = items.map((item, idx) => ({
      workoutId: workout._id,
      userId,
      exerciseId: Types.ObjectId.isValid(item.exerciseId)
        ? new Types.ObjectId(item.exerciseId)
        : item.exerciseId,
      uid: item.uid,
      order: idx,
    }));

    const insertedItems = await this.itemEntityModel.insertMany(itemPayloads);

    const setPayloads: any[] = [];
    insertedItems.forEach((itemDoc, idx) => {
      const sets = items[idx].sets || [];
      sets.forEach((s, sIdx) => {
        setPayloads.push({
          workoutItemId: itemDoc._id,
          workoutId: workout._id,
          userId,
          exerciseId: itemDoc.exerciseId,
          setId: s.id || this.generateUid('set'),
          setNumber: sIdx + 1,
          reps: Math.max(1, Number(s.reps) || 10),
          weight: Math.max(0, Number(s.weight) || 0),
          done: Boolean(s.done),
        });
      });
    });

    if (setPayloads.length) {
      await this.itemSetModel.insertMany(setPayloads);
    }
  }

  /**
   * Retrieves user's active workout builder draft, initializing one if empty
   */
  async getCurrentWorkout(userId: string): Promise<any> {
    const userObjId = new Types.ObjectId(userId);
    let workout = await this.workoutModel
      .findOne({ userId: userObjId, isTemplate: false })
      .exec();

    if (!workout) {
      workout = await this.workoutModel.create({
        userId: userObjId,
        name: 'My Workout',
        isTemplate: false,
      });
    }

    return this.assembleWorkout(workout);
  }

  /**
   * Overwrites/saves the entire active builder workout state
   */
  async saveCurrentWorkout(userId: string, dto: UpdateWorkoutDto): Promise<any> {
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
        { $set: { name: dto.name } },
        { new: true, upsert: true },
      )
      .exec();

    await this.replaceWorkoutItems(workout, userObjId, resolvedItems);
    return this.assembleWorkout(workout);
  }

  /**
   * Appends an exercise item to the current workout draft
   */
  async addItem(userId: string, dto: AddWorkoutItemDto): Promise<any> {
    const exercise = await this.exercisesService.findById(dto.exerciseId);
    const exObjId = exercise._id as Types.ObjectId;

    const defaultWeight = exercise.equipment === 'body weight' ? 0 : 20;
    const setsCount = dto.sets || 3;
    const reps = dto.reps || 10;
    const weight = typeof dto.weight === 'number' ? dto.weight : defaultWeight;

    const userObjId = new Types.ObjectId(userId);
    let workout = await this.workoutModel
      .findOne({ userId: userObjId, isTemplate: false })
      .exec();

    if (!workout) {
      workout = await this.workoutModel.create({
        userId: userObjId,
        name: 'My Workout',
        isTemplate: false,
      });
    }

    const currentCount = await this.itemEntityModel
      .countDocuments({ workoutId: workout._id })
      .exec();

    const itemDoc = await this.itemEntityModel.create({
      workoutId: workout._id,
      userId: userObjId,
      exerciseId: exObjId,
      uid: this.generateUid('item'),
      order: currentCount,
    });

    const setPayloads = Array.from({ length: setsCount }, (_, idx) => ({
      workoutItemId: itemDoc._id,
      workoutId: workout._id,
      userId: userObjId,
      exerciseId: exObjId,
      setId: this.generateUid('set'),
      setNumber: idx + 1,
      reps,
      weight,
      done: false,
    }));

    if (setPayloads.length) {
      await this.itemSetModel.insertMany(setPayloads);
    }

    return this.assembleWorkout(workout);
  }

  /**
   * Removes an item by UID from the current workout draft
   */
  async removeItem(userId: string, itemId: string): Promise<any> {
    const userObjId = new Types.ObjectId(userId);
    const workout = await this.workoutModel
      .findOne({ userId: userObjId, isTemplate: false })
      .exec();

    if (!workout) {
      throw new NotFoundException('Active workout not found');
    }

    const deletedItem = await this.itemEntityModel
      .findOneAndDelete({ workoutId: workout._id, uid: itemId })
      .exec();

    if (deletedItem) {
      await this.itemSetModel.deleteMany({ workoutItemId: deletedItem._id }).exec();
    }

    return this.assembleWorkout(workout);
  }

  /**
   * Loads a pre-configured routine template into the builder
   */
  async loadRoutine(userId: string, dto: LoadRoutineDto): Promise<any> {
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
        { $set: { name: dto.name } },
        { new: true, upsert: true },
      )
      .exec();

    await this.replaceWorkoutItems(workout, userObjId, items);
    return this.assembleWorkout(workout);
  }
}
