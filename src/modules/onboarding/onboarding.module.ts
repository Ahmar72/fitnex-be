import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  OnboardingProfile,
  OnboardingProfileSchema,
} from './schemas/onboarding-profile.schema';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';

/**
 * Onboarding Module
 * 
 * Provides metabolic calculation services and manages user onboarding profiles.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OnboardingProfile.name, schema: OnboardingProfileSchema },
    ]),
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService, MongooseModule],
})
export class OnboardingModule {}
