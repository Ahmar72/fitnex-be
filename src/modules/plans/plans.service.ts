import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { Plan, PlanDocument } from './schemas/plan.schema';
import {
  UserActivePlan,
  UserActivePlanDocument,
} from './schemas/user-active-plan.schema';
import {
  PlanOverview,
  PlanOverviewDocument,
} from './schemas/plan-overview.schema';
import {
  PlanSchedule,
  PlanScheduleDocument,
} from './schemas/plan-schedule.schema';
import {
  EnrollPlanDto,
  FilterPlansDto,
  ProgressPlanDto,
} from './dto/plan-dtos';

/**
 * Training Plans & Programs Service
 * 
 * Manages program templates, automated seed population from plansData,
 * user enrollment, and multi-week day-by-day progression.
 */
@Injectable()
export class PlansService implements OnModuleInit {
  private readonly logger = new Logger(PlansService.name);
  private cachedCategories: any[] = [];

  constructor(
    @InjectModel(Plan.name)
    private readonly planModel: Model<PlanDocument>,
    @InjectModel(UserActivePlan.name)
    private readonly activePlanModel: Model<UserActivePlanDocument>,
    @InjectModel(PlanOverview.name)
    private readonly planOverviewModel: Model<PlanOverviewDocument>,
    @InjectModel(PlanSchedule.name)
    private readonly planScheduleModel: Model<PlanScheduleDocument>,
  ) {}

  /**
   * Seed plans into MongoDB on initialization
   */
  async onModuleInit() {
    await this.seedPlansIfEmpty();
  }

  /**
   * Automatically populates the 9 pre-built plans from seed JSON
   */
  async seedPlansIfEmpty() {
    try {
      const count = await this.planModel.countDocuments().exec();
      if (count >= 9) {
        this.logger.log(`Training plans ready (${count} programs indexed)`);
        return;
      }

      this.logger.log(`Seeding training plan programs...`);
      const candidatePaths = [
        path.resolve(__dirname, './data/plans-seed.json'),
        path.resolve(process.cwd(), 'src/modules/plans/data/plans-seed.json'),
        path.resolve(process.cwd(), 'dist/modules/plans/data/plans-seed.json'),
      ];
      const seedPath = candidatePaths.find((p) => fs.existsSync(p));

      if (!seedPath) {
        this.logger.warn(`Plans seed file not found in candidates. Skipping.`);
        return;
      }

      const raw = fs.readFileSync(seedPath, 'utf8');
      const data = JSON.parse(raw);
      this.cachedCategories = data.categories || [];

      const bulkOps = (data.plans || []).map((p: any) => ({
        updateOne: {
          filter: { planId: p.id },
          update: {
            $set: {
              planId: p.id,
              key: p.key,
              name: p.name,
              tagline: p.tagline || '',
              weeks: p.weeks || 6,
              frequency: p.frequency || '4 days / week',
              level: p.level || 'All Levels',
              targetMuscle: p.targetMuscle || '',
              image: p.image || '',
              accentColor: p.accentColor || '#ff5e1a',
              description: p.description || '',
              overview: p.overview || [],
              schedule: p.schedule || [],
            },
          },
          upsert: true,
        },
      }));

      if (bulkOps.length) {
        await this.planModel.bulkWrite(bulkOps);
        const finalCount = await this.planModel.countDocuments().exec();
        this.logger.log(`Successfully indexed ${finalCount} training programs!`);
      }
    } catch (err: any) {
      this.logger.error(`Plan seeding failed: ${err.message}`);
    }
  }

  /**
   * Returns all available plan categories
   */
  async getCategories(): Promise<any[]> {
    if (this.cachedCategories.length) return this.cachedCategories;

    const seedPath = path.resolve(__dirname, './data/plans-seed.json');
    if (fs.existsSync(seedPath)) {
      try {
        const raw = fs.readFileSync(seedPath, 'utf8');
        const data = JSON.parse(raw);
        this.cachedCategories = data.categories || [];
        return this.cachedCategories;
      } catch {
        /* fallback */
      }
    }

    return [
      { key: 'all', label: 'All Plans' },
      { key: 'abs', label: 'Abs & Core' },
      { key: 'biceps', label: 'Biceps' },
      { key: 'triceps', label: 'Triceps' },
      { key: 'shoulders', label: 'Shoulders' },
      { key: 'chest', label: 'Chest' },
      { key: 'back', label: 'Back & Wings' },
      { key: 'legs', label: 'Legs & Quads' },
      { key: 'muscle-building', label: 'Muscle Building' },
      { key: 'weight-loss', label: 'Weight Loss' },
    ];
  }

  /**
   * Assembles normalized plan_overviews and plan_schedules onto plan documents
   */
  private async attachPlanDetails(plans: PlanDocument[]): Promise<any[]> {
    if (!plans.length) return [];
    const planIds = plans.map((p) => p._id);

    const [overviews, schedules] = await Promise.all([
      this.planOverviewModel.find({ planId: { $in: planIds } }).sort({ order: 1 }).exec(),
      this.planScheduleModel.find({ planId: { $in: planIds } }).sort({ dayIndex: 1 }).exec(),
    ]);

    const overviewMap = new Map<string, any[]>();
    for (const ov of overviews) {
      const k = ov.planId.toString();
      if (!overviewMap.has(k)) overviewMap.set(k, []);
      overviewMap.get(k)!.push({ label: ov.label, value: ov.value });
    }

    const scheduleMap = new Map<string, any[]>();
    for (const sc of schedules) {
      const k = sc.planId.toString();
      if (!scheduleMap.has(k)) scheduleMap.set(k, []);
      scheduleMap.get(k)!.push({
        day: sc.day,
        title: sc.title,
        focus: sc.focus,
        isRest: sc.isRest,
        exerciseIds: sc.exerciseIds,
      });
    }

    return plans.map((p) => ({
      ...p.toJSON(),
      overview: overviewMap.get(p._id.toString()) || [],
      schedule: scheduleMap.get(p._id.toString()) || [],
    }));
  }

  /**
   * Retrieves all workout programs with optional category filtering
   */
  async findAll(filterDto: FilterPlansDto): Promise<any[]> {
    const query: any = {};
    if (filterDto.category && filterDto.category !== 'all') {
      query.key = filterDto.category.toLowerCase().trim();
    }

    const plans = await this.planModel.find(query).exec();
    return this.attachPlanDetails(plans);
  }

  /**
   * Retrieves detailed program metadata and schedule by ID
   */
  async findById(id: string): Promise<any> {
    const conditions: any[] = [{ planId: id }];
    if (Types.ObjectId.isValid(id)) {
      conditions.push({ _id: new Types.ObjectId(id) });
    }

    const plan = await this.planModel
      .findOne({ $or: conditions })
      .exec();

    if (!plan) {
      throw new NotFoundException(`Training plan with ID "${id}" was not found`);
    }

    const [assembled] = await this.attachPlanDetails([plan]);
    return assembled;
  }

  /**
   * Retrieves the currently active enrolled plan for an authenticated user
   */
  async getActivePlan(userId: string): Promise<any> {
    const userObjId = new Types.ObjectId(userId);
    const active = await this.activePlanModel
      .findOne({ userId: userObjId, isActive: true })
      .exec();

    if (!active) {
      return null;
    }

    const planDoc = await this.planModel.findOne({ planId: active.planId }).exec();
    const [assembledPlan] = planDoc ? await this.attachPlanDetails([planDoc]) : [null];
    const enrollmentJson = active.toJSON() as any;

    return {
      ...enrollmentJson,
      planId: active.planId,
      planName: assembledPlan?.name || active.planId,
      daysPerWeek: active.daysPerWeek || 3,
      startedAt: active.enrolledAt,
      enrollment: enrollmentJson,
      plan: assembledPlan,
    };
  }

  /**
   * Enrolls user into a training program
   */
  async enroll(userId: string, dto: EnrollPlanDto): Promise<any> {
    const plan = await this.findById(dto.planId);
    const userObjId = new Types.ObjectId(userId);

    // Deactivate previous active plans
    await this.activePlanModel.updateMany(
      { userId: userObjId, isActive: true },
      { $set: { isActive: false } },
    );

    // Create new active enrollment
    const enrollment = await this.activePlanModel.create({
      userId: userObjId,
      planId: plan.planId,
      currentWeek: 1,
      currentDayIndex: 0,
      daysPerWeek: dto.daysPerWeek || 4,
      completedDates: [],
      lastWorkoutDate: null,
      enrolledAt: new Date(),
      completedAt: null,
      isActive: true,
    });

    const enrollmentJson = enrollment.toJSON() as any;
    return {
      message: `Enrolled in "${plan.name}" successfully`,
      ...enrollmentJson,
      planId: plan.planId,
      planName: plan.name,
      daysPerWeek: enrollment.daysPerWeek,
      startedAt: enrollment.enrolledAt,
      enrollment: enrollmentJson,
      plan,
    };
  }

  /**
   * Advances active plan workout progress upon day completion
   */
  async progress(userId: string, dto: ProgressPlanDto): Promise<any> {
    const userObjId = new Types.ObjectId(userId);
    const active = await this.activePlanModel
      .findOne({ userId: userObjId, isActive: true })
      .exec();

    if (!active) {
      throw new BadRequestException('No active plan enrollment found for this user');
    }

    const plan = await this.planModel.findOne({ planId: active.planId }).exec();
    const maxWeeks = plan?.weeks || 6;

    const dateKey = dto.dateKey || new Date().toISOString().split('T')[0];
    const completedDates = Array.from(new Set([...active.completedDates, dateKey]));

    let nextDayIndex = (typeof dto.dayIndex === 'number' ? dto.dayIndex + 1 : active.currentDayIndex + 1);
    let nextWeek = typeof dto.week === 'number' ? dto.week : active.currentWeek;
    let completedAt = active.completedAt;
    let isPlanComplete = false;

    if (nextDayIndex >= 7) {
      nextDayIndex = 0;
      nextWeek += 1;
    }

    if (nextWeek > maxWeeks) {
      completedAt = new Date();
      isPlanComplete = true;
    }

    active.completedDates = completedDates;
    active.lastWorkoutDate = dateKey;
    active.currentDayIndex = nextDayIndex;
    active.currentWeek = Math.min(nextWeek, maxWeeks);
    active.completedAt = completedAt;
    if (isPlanComplete) {
      active.isActive = false;
    }

    await active.save();

    return {
      message: isPlanComplete ? 'Congratulations! You completed the full program!' : 'Plan progress advanced',
      isPlanComplete,
      enrollment: active.toJSON(),
    };
  }

  /**
   * Cancels user's active plan enrollment
   */
  async cancel(userId: string): Promise<{ message: string }> {
    const userObjId = new Types.ObjectId(userId);
    const result = await this.activePlanModel.updateMany(
      { userId: userObjId, isActive: true },
      { $set: { isActive: false } },
    );

    if (result.matchedCount === 0) {
      throw new BadRequestException('No active plan found to cancel');
    }

    return { message: 'Active plan canceled successfully' };
  }
}
