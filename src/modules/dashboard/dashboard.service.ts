import { Injectable, Logger } from '@nestjs/common';
import { HistoryService } from '../history/history.service';
import { PlansService } from '../plans/plans.service';
import { OnboardingService } from '../onboarding/onboarding.service';

/**
 * Dashboard & Analytics Service
 * 
 * Aggregates consolidated dashboard overview: active plan status, weekly streak,
 * total workouts, volume lifted this week, and calorie/macro goals in a single request.
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly historyService: HistoryService,
    private readonly plansService: PlansService,
    private readonly onboardingService: OnboardingService,
  ) {}

  /**
   * Retrieves high-performance consolidated dashboard data
   */
  async getSummary(userId: string): Promise<any> {
    const [streakData, weeklyData, activePlan, recentHistory, onboardingProfile] =
      await Promise.all([
        this.historyService.calculateStreak(userId).catch(() => ({ streak: 0, lastTrainedDate: null })),
        this.historyService.getWeeklyVolume(userId).catch(() => ({ weeklyVolumeKg: 0, workoutsThisWeek: 0 })),
        this.plansService.getActivePlan(userId).catch(() => null),
        this.historyService.getHistory(userId, { page: 1, limit: 3 }).catch(() => ({ items: [], total: 0 })),
        this.onboardingService.getProfile(userId).catch(() => null),
      ]);

    return {
      streak: streakData.streak,
      lastTrainedDate: streakData.lastTrainedDate,
      workoutsThisWeek: weeklyData.workoutsThisWeek,
      weeklyVolumeKg: weeklyData.weeklyVolumeKg,
      totalWorkouts: recentHistory.total,
      activePlan,
      recentWorkouts: recentHistory.items,
      nutritionTarget: onboardingProfile
        ? {
            goal: onboardingProfile.goal,
            targetCalories: onboardingProfile.targetCalories,
            protein: onboardingProfile.targetProteinGrams,
            carbs: onboardingProfile.targetCarbsGrams,
            fat: onboardingProfile.targetFatGrams,
          }
        : null,
    };
  }
}
