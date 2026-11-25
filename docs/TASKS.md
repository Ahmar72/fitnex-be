# Fitnex — Project Implementation Roadmap & Tasks (TASKS.md)

This living document tracks the granular development progress across all project phases.

---

## Phase 1: Foundation, Infrastructure & Core Setup
- [x] Scaffold NestJS TypeScript backend project in `fitnex-be/`.
- [x] Configure MongoDB Mongoose connection and environment variables (`.env`).
- [x] Configure global `ValidationPipe` with whitelist and transform options.
- [x] Configure global `TransformInterceptor` for standard API response envelopes.
- [x] Configure Swagger OpenAPI documentation at `/api/docs`.
- [x] Configure dynamic CORS origin reflection and reverse proxy in `fitnex-fe/vite.config.js`.
- **Status:** Complete (Verified & Pushed)

---

## Phase 2: Authentication, Security & Metabolic Calculator
- [x] Create `User` schema with bcrypt password hashing and `select: false` on sensitive tokens.
- [x] Implement stateless JWT authentication (Access Token + Refresh Token rotation).
- [x] Implement 6-digit email OTP verification via Mailtrap SMTP.
- [x] Implement forgot password and password reset with token expiration.
- [x] Implement `OnboardingModule` with Mifflin-St Jeor metabolic calculations (BMR, TDEE, Calories, Macros).
- [x] Enforce mass-assignment defense (preventing unauthorized role elevation).
- [x] Run 16/16 automated security and auth tests.
- **Status:** Complete (Verified & Pushed)

---

## Phase 3: Exercises Catalog & Seed Migration
- [x] Create `Exercise` schema with anatomical attributes (`bodyPart`, `target`, `equipment`) and text search index.
- [x] Create `ExerciseFavorite` schema with compound unique index on `(userId, exerciseId)`.
- [x] Implement auto-seed engine populating all 1,324 movements and multi-lingual instruction step files.
- [x] Implement cached facet aggregations for sub-2ms response times.
- [x] Expose catalog endpoints: `GET /exercises`, `GET /exercises/facets`, `GET /exercises/:id`, `GET /exercises/favorites/me`, `POST /exercises/:id/favorite`.
- [x] Run 31/31 automated exercise catalog tests.
- **Status:** Complete (Verified & Pushed)

---

## Phase 4: Workout Builder & Training Programs Engine
- [x] Create `Workout` schema with embedded `items` and `sets` subdocuments.
- [x] Implement builder draft sync, item additions, set adjustments, and routine template loading.
- [x] Create `Plan` schema and `UserActivePlan` schema.
- [x] Extract and auto-seed the 9 pre-built training programs and 10 categories from `plansData.js`.
- [x] Implement program enrollment, day-by-day continuous progression, and cancellation.
- [x] Expose endpoints under `/api/v1/workouts` and `/api/v1/plans`.
- [x] Run 52/52 automated tests covering workouts, plans, and regression checks.
- **Status:** Complete (Verified & Pushed)

---

## Phase 5: Workout Sessions, Live Logging & Analytics
- [x] Create `WorkoutSession` schema (duration, total volume, sets, reps, muscle targets, exercise snapshots, completedAt).
- [x] Implement volume normalization and at-least-one-completed-set validation rules.
- [x] Implement consecutive training days streak calculation engine.
- [x] Implement personal records (PR) detection per exercise (highest weight, highest volume).
- [x] Expose history endpoints: `GET /history`, `POST /history`, `GET /history/streak`, `GET /history/prs`.
- [x] Expose dashboard aggregate endpoint: `GET /dashboard/summary`.
- [x] Run automated tests for Phase 5 (33/33 passed).
- **Status:** Complete (Verified & Pushed on feature branch and merged to main)

---

## Phase 6: Nutrition, Meal Planner & Daily Calorie Tracking (NEXT)
- [ ] Create `Meal` schema, `UserMealLog` schema, and `UserMealFavorite` schema.
- [ ] Seed 28 chef-curated recipes from `fitnex-fe/src/data/meals.js`.
- [ ] Implement daily meal logging and consumption tracking.
- [ ] Implement daily summary calculation: consumed calories/macros vs user's Mifflin-St Jeor target.
- [ ] Expose meal endpoints under `/api/v1/meals`.
- [ ] Run automated tests for Phase 6.
- **Status:** Pending

---

## Phase 7: Client Integration & Full System Verification
- [ ] Implement typed API client (`api.js`) in `fitnex-fe`.
- [ ] Connect `AuthContext` to backend session state and token refresh.
- [ ] Connect `DataContext` to `/exercises` and `/exercises/facets`.
- [ ] Connect `WorkoutContext` to `/workouts` and `/history`.
- [ ] Connect `Plans.jsx` to `/plans` and `/plans/active`.
- [ ] Full end-to-end regression validation.
- **Status:** Pending
