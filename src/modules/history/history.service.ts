import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WorkoutSession,
  WorkoutSessionDocument,
} from './schemas/workout-session.schema';
import {
  PersonalRecord,
  PersonalRecordDocument,
} from './schemas/personal-record.schema';
import {
  WorkoutSessionExercise,
  WorkoutSessionExerciseDocument,
} from './schemas/workout-session-exercise.schema';
import {
  WorkoutSessionSet,
  WorkoutSessionSetDocument,
} from './schemas/workout-session-set.schema';
import {
  CreateWorkoutSessionDto,
  HistoryQueryDto,
} from './dto/create-session.dto';
import { ExercisesService } from '../exercises/exercises.service';

/**
 * Workout History, PRs & Analytics Service
 *
 * Manages workout completion logging, personal record (PR) detection,
 * consecutive training streak calculation, and volume analytics.
 * Persists flat normalized records across `workout_sessions`,
 * `workout_session_exercises`, and `workout_session_sets`.
 */
@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    @InjectModel(WorkoutSession.name)
    public readonly sessionModel: Model<WorkoutSessionDocument>,
    @InjectModel(PersonalRecord.name)
    public readonly prModel: Model<PersonalRecordDocument>,
    @InjectModel(WorkoutSessionExercise.name)
    public readonly sessionExerciseModel: Model<WorkoutSessionExerciseDocument>,
    @InjectModel(WorkoutSessionSet.name)
    public readonly sessionSetModel: Model<WorkoutSessionSetDocument>,
    private readonly exercisesService: ExercisesService,
  ) {}

  /**
   * Helper to format Date into YYYY-MM-DD
   */
  private formatDateKey(d: Date = new Date()): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Logs a completed workout session, evaluates PRs, and stores normalized exercise/set records
   */
  async logSession(userId: string, dto: CreateWorkoutSessionDto): Promise<any> {
    if (!dto.exercises || !dto.exercises.length) {
      throw new BadRequestException('Workout must include at least one completed exercise');
    }

    const emptyExercise = dto.exercises.find((e) => !e.sets || !e.sets.length);
    if (emptyExercise) {
      throw new BadRequestException('Each logged exercise must contain at least one completed set');
    }

    const userObjId = new Types.ObjectId(userId);
    const dateKey = dto.dateKey || this.formatDateKey();
    const trainedTargetsSet = new Set<string>();
    const exerciseIdsList: Types.ObjectId[] = [];
    const preparedExercises: Array<{
      doc: any;
      sets: Array<{ setNumber: number; reps: number; weight: number; isPR: boolean }>;
    }> = [];

    let totalVolumeKg = 0;
    let completedSetsCount = 0;
    let completedRepsCount = 0;
    let totalPrsCount = 0;

    for (const exDto of dto.exercises) {
      let exName = exDto.name || 'Exercise';
      let exBodyPart = '';
      let exTarget = '';
      let exObjId: Types.ObjectId | null = null;

      try {
        const exMeta = await this.exercisesService.findById(exDto.exerciseId);
        if (exMeta) {
          exObjId = exMeta._id as Types.ObjectId;
          exName = exMeta.name;
          exBodyPart = exMeta.bodyPart || '';
          exTarget = exMeta.target || '';
          if (exTarget) trainedTargetsSet.add(exTarget);
          if (exBodyPart) trainedTargetsSet.add(exBodyPart);
        }
      } catch {
        if (Types.ObjectId.isValid(exDto.exerciseId)) {
          exObjId = new Types.ObjectId(exDto.exerciseId);
        }
      }

      if (exObjId) {
        exerciseIdsList.push(exObjId);
      }

      const prQuery = exObjId ? { userId: userObjId, exerciseId: exObjId } : null;
      const existingPR = prQuery ? await this.prModel.findOne(prQuery).exec() : null;

      let currentMaxWeight = existingPR ? existingPR.maxWeight : 0;
      let currentMaxVolume = existingPR ? existingPR.maxVolume : 0;
      let bestReps = existingPR ? existingPR.repsAtMaxWeight : 1;
      let isExercisePR = false;
      let exerciseVolume = 0;
      let exerciseReps = 0;
      let maxSetWeight = 0;

      const processedSets: Array<{ setNumber: number; reps: number; weight: number; isPR: boolean }> = [];
      let setNum = 1;

      for (const s of exDto.sets) {
        const reps = Math.max(1, Number(s.reps) || 10);
        const weight = Math.max(0, Number(s.weight) || 0);
        const setVolume = weight * reps;

        exerciseVolume += setVolume;
        exerciseReps += reps;
        totalVolumeKg += setVolume;
        completedSetsCount += 1;
        completedRepsCount += reps;
        if (weight > maxSetWeight) maxSetWeight = weight;

        let isSetPR = false;
        if (weight > currentMaxWeight && weight > 0) {
          isSetPR = true;
          isExercisePR = true;
          currentMaxWeight = weight;
          bestReps = reps;
          totalPrsCount += 1;
        }

        processedSets.push({
          setNumber: s.setNumber || setNum++,
          reps,
          weight,
          isPR: isSetPR,
        });
      }

      if (exObjId) {
        preparedExercises.push({
          doc: {
            userId: userObjId,
            exerciseId: exObjId,
            exerciseName: exName,
            bodyPart: exBodyPart,
            target: exTarget,
            setsCount: processedSets.length,
            completedReps: exerciseReps,
            totalVolumeKg: Math.round(exerciseVolume * 10) / 10,
            maxWeight: maxSetWeight,
          },
          sets: processedSets,
        });

        if (isExercisePR || exerciseVolume > currentMaxVolume) {
          await this.prModel.findOneAndUpdate(
            { userId: userObjId, exerciseId: exObjId },
            {
              $set: {
                exerciseName: exName,
                maxWeight: currentMaxWeight,
                maxVolume: Math.max(currentMaxVolume, exerciseVolume),
                repsAtMaxWeight: bestReps,
                achievedAt: new Date(),
              },
            },
            { upsert: true, new: true },
          );
        }
      }
    }

    const session = await this.sessionModel.create({
      userId: userObjId,
      planId: dto.planId || null,
      dateKey,
      name: dto.name || 'Workout',
      durationSeconds: dto.durationSeconds || 0,
      totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
      completedSets: completedSetsCount,
      completedReps: completedRepsCount,
      prsCount: totalPrsCount,
      trainedTargets: Array.from(trainedTargetsSet),
      exercises: exerciseIdsList,
      completedAt: new Date(),
    });

    // Save normalized workout_session_exercises and workout_session_sets
    if (preparedExercises.length) {
      const insertedExercises = await this.sessionExerciseModel.insertMany(
        preparedExercises.map((item) => ({
          ...item.doc,
          sessionId: session._id,
        })),
      );

      const setDocs: any[] = [];
      insertedExercises.forEach((exDoc, idx) => {
        const sets = preparedExercises[idx].sets;
        sets.forEach((s) => {
          setDocs.push({
            sessionExerciseId: exDoc._id,
            sessionId: session._id,
            userId: userObjId,
            exerciseId: exDoc.exerciseId,
            setNumber: s.setNumber,
            reps: s.reps,
            weight: s.weight,
            isPR: s.isPR,
          });
        });
      });

      if (setDocs.length) {
        await this.sessionSetModel.insertMany(setDocs);
      }
    }

    return {
      message: 'Workout session logged successfully!',
      session: session.toJSON(),
      prsDetected: totalPrsCount,
    };
  }

  /**
   * Retrieves paginated workout session logs for user
   */
  async getHistory(userId: string, queryDto: HistoryQueryDto): Promise<any> {
    const page = Math.max(1, Number(queryDto.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(queryDto.limit) || 20));
    const skip = (page - 1) * limit;

    const userObjId = new Types.ObjectId(userId);

    const [items, total] = await Promise.all([
      this.sessionModel
        .find({ userId: userObjId })
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.sessionModel.countDocuments({ userId: userObjId }).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: items.map((doc) => doc.toJSON()),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Computes consecutive training days streak ending today or yesterday
   */
  async calculateStreak(userId: string): Promise<{ streak: number; lastTrainedDate: string | null }> {
    const userObjId = new Types.ObjectId(userId);

    const sessions = await this.sessionModel
      .find({ userId: userObjId })
      .select('dateKey')
      .sort({ dateKey: -1 })
      .exec();

    if (!sessions.length) {
      return { streak: 0, lastTrainedDate: null };
    }

    const datesSet = new Set(sessions.map((s) => s.dateKey));
    const lastTrainedDate = sessions[0].dateKey;

    let streak = 0;
    const checkDate = new Date();

    if (!datesSet.has(this.formatDateKey(checkDate))) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (datesSet.has(this.formatDateKey(checkDate))) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return { streak, lastTrainedDate };
  }

  /**
   * Retrieves all personal records for user
   */
  async getPersonalRecords(userId: string): Promise<PersonalRecordDocument[]> {
    const userObjId = new Types.ObjectId(userId);
    return this.prModel
      .find({ userId: userObjId })
      .sort({ maxWeight: -1 })
      .exec();
  }

  /**
   * Computes weekly training volume in kg for user
   */
  async getWeeklyVolume(userId: string): Promise<{ weeklyVolumeKg: number; workoutsThisWeek: number }> {
    const userObjId = new Types.ObjectId(userId);

    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const sessions = await this.sessionModel
      .find({
        userId: userObjId,
        completedAt: { $gte: monday },
      })
      .select('totalVolumeKg')
      .exec();

    const weeklyVolumeKg = sessions.reduce((acc, s) => acc + (s.totalVolumeKg || 0), 0);
    return {
      weeklyVolumeKg: Math.round(weeklyVolumeKg * 10) / 10,
      workoutsThisWeek: sessions.length,
    };
  }
}
