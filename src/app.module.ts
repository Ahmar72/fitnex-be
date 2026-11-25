import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { envConfig } from './config/env.config';
import { DatabaseModule } from './database/database.module';
import { MailModule } from './mail/mail.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';
import { PlansModule } from './modules/plans/plans.module';
import { HistoryModule } from './modules/history/history.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

/**
 * Root Application Module
 * 
 * Orchestrates core configuration, MongoDB database connectivity,
 * Nodemailer Mailtrap services, and feature modules.
 * Configures the global JWT authentication guard.
 */
@Module({
  imports: [
    // Global environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),

    // MongoDB connection via Mongoose
    DatabaseModule,

    // Mailtrap email dispatch via Nodemailer
    MailModule,

    // Feature Modules
    HealthModule,
    UsersModule,
    AuthModule,
    OnboardingModule,
    ExercisesModule,
    WorkoutsModule,
    PlansModule,
    HistoryModule,
    DashboardModule,
    NutritionModule,
  ],
  providers: [
    // Enable JWT guard globally: all routes require token unless marked @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
