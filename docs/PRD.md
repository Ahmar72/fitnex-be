# Fitnex — Product Requirements Document (PRD)

**Version:** 1.0.0  
**Status:** Approved & In Active Implementation  
**Product:** Fitnex Web Application (Frontend + Backend)  
**Target Users:** Fitness enthusiasts, athletes, gym-goers, and beginners seeking guided training, metabolic nutrition, and structured progression.

---

## 1. Executive Summary & Problem Statement

### 1.1 The Problem
Most fitness applications suffer from fragmented experiences:
- Exercise libraries lack accurate anatomical targeting and multi-lingual visual instructions.
- Workout builders are overly rigid or clunky to customize on the fly.
- Calorie and macro calculators rely on arbitrary generic formulas without Mifflin-St Jeor calibration or activity multipliers.
- Training plans do not offer seamless day-to-day continuous progression or rest-day integration.
- Nutrition trackers are disconnected from workout intensity and physical goals.

### 1.2 The Fitnex Solution
Fitnex delivers an all-in-one web-based fitness companion that unites:
1. **1,324 Animated Exercise Movements** with primary/secondary muscle group mapping, multi-language step-by-step guides, and equipment classification.
2. **Interactive Live Workout Builder** allowing live set, rep, and weight adjustments with auto-rest timers and speech synthesis.
3. **Mifflin-St Jeor Metabolic Calculator** calculating customized BMR, TDEE, and goal-tailored macronutrient distributions (protein, carbs, fat).
4. **9 Continuous Multi-Week Training Programs** with scientific scheduling and automated day-by-day progression tracking.
5. **Goal-Driven Nutrition & Meal Planner** featuring 28 chef-curated macro-calibrated recipes.

---

## 2. Core Personas

### Persona 1: "The Dedicated Lifter" (Alex, 27)
- **Goal:** Hypertrophy & Progressive Overload.
- **Needs:** Fast builder to log weights/reps, streak tracking, personal record (PR) detection, and high-protein nutrition guidance.

### Persona 2: "The Fitness Starter" (Sarah, 31)
- **Goal:** Weight loss & healthy habit formation.
- **Needs:** Multi-language animated exercise demos, clear rest timers, guided 4-week structured plans, and calibrated calorie deficits.

---

## 3. Scope & Phased Rollout

| Phase | Module | Scope | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Foundation & Architecture | NestJS framework setup, MongoDB Mongoose integration, global pipes/guards | **DONE** |
| **Phase 2** | Auth, Security & Onboarding | JWT auth, Mailtrap OTP verification, password recovery, MSJ metabolic calculator | **DONE** |
| **Phase 3** | Exercise Library & Seed | 1,324 movements indexed, multi-lingual steps, cached facet search, favorites | **DONE** |
| **Phase 4** | Workout Builder & Programs | Builder draft sync, routine loading, 9 seeded training plans, continuous progression | **DONE** |
| **Phase 5** | Workout Sessions & Analytics | Live session logging, volume validation, PR detection, streak calculation | *Next* |
| **Phase 6** | Nutrition & Meal Planner | 28 recipes seeded, daily meal logging, macro target tracker | *Pending* |
| **Phase 7** | Client-Backend Integration | Connecting React frontend to NestJS backend, full E2E validation | *Pending* |

---

## 4. Success Metrics
- **Performance:** Sub-30ms P95 API response times for exercise searches and plan schedules.
- **Security:** 100% select:false protection on sensitive authentication fields, zero credential exposure in responses.
- **Reliability:** 100% automated test pass rate across all endpoints and business logic.
- **User Experience:** Seamless responsive UI with sub-second page transitions and offline-safe local drafts.
