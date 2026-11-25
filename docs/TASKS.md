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
- **Status:** Complete (Verified & Pushed)

---

## Phase 6: Nutrition, Meal Planner & Daily Calorie Tracking
- [x] Create `Meal` schema, `UserMealLog` schema, and `UserMealFavorite` schema.
- [x] Extract and auto-seed 52 chef-curated recipes and 7 categories from `meals-seed.json`.
- [x] Implement daily meal logging, servings multiplier, and consumption tracking.
- [x] Implement daily summary calculation: consumed calories/macros vs user's Mifflin-St Jeor metabolic target.
- [x] Expose meal endpoints under `/api/v1/meals` (`/meals`, `/meals/categories`, `/meals/favorites/me`, `/meals/favorites/:id`, `/meals/logs`, `/meals/logs/me`, `/meals/daily-summary`, `/meals/:id`).
- [x] Run 12/12 Phase 6 automated tests and 12/12 full repository regression suite.
- **Status:** Complete (Verified & Pushed on branch `feature/phase-6-nutrition-meals`, merged to `main`)

---

## Phase 7: Client Integration & Full System Verification
- [x] Expand `fitnex-fe` API client (`api.js`) with automatic token rotation and full module coverage.
- [x] Verify `AuthContext` maintains session tokens, rotation, and profile sync.
- [x] Connect `DataContext` to live `/exercises` and `/exercises/facets` with offline asset fallback.
- [x] Connect `WorkoutContext` to `/workouts` draft, `/exercises/favorites/me`, and `/history` logging.
- [x] Connect `Plans.jsx` to `/plans` and `/plans/active/me` enrollment/cancellation.
- [x] Connect `Nutrition.jsx` to `/meals` and `/meals/daily-summary` live calorie budget tracking.
- [x] Run 13/13 automated frontend proxy and E2E integration tests.
- **Status:** Complete (Verified & Pushed on branch `feature/phase-7-client-integration`, merged to `main`)
