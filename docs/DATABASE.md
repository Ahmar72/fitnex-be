# Fitnex — Database Architecture & Standards (DATABASE.md)

**Database Engine:** MongoDB 7  
**ODM:** Mongoose 8 (`@nestjs/mongoose`)  
**Host & Port:** `mongodb://localhost:27017/fitnex`

---

## 1. Database Standards & Conventions

1. **Naming Conventions:**
   - Collection names: Lowercase plural snake_case or standard plural (e.g., `users`, `exercises`, `workouts`, `plans`).
   - Fields: `camelCase` (e.g., `exerciseId`, `targetMuscle`, `currentWeek`).
   - Foreign Keys: `Types.ObjectId` referencing primary entity name (e.g., `userId: { type: Types.ObjectId, ref: 'User' }`).
2. **Document Transformation & Serialization:**
   - All schemas implement Mongoose `toJSON` transforms:
     ```typescript
     transform: (_, ret: any) => {
       ret.id = ret.id || ret._id.toString();
       delete ret._id;
       delete ret.__v;
       return ret;
     }
     ```
3. **Defense-in-Depth Schema Security:**
   - Sensitive security fields (`password`, `refreshTokenHash`, `verificationToken`, `verificationTokenExpires`, `resetPasswordToken`, `resetPasswordExpires`) must specify `select: false`.
4. **Indexing Strategy:**
   - Compound text index for catalog search: `{ name: 'text', target: 'text', bodyPart: 'text' }`.
   - Compound unique index on user favorites: `{ userId: 1, exerciseId: 1 }`.
   - Unique active draft constraint: `{ userId: 1, isTemplate: 1 }`.
   - Active plan lookup index: `{ userId: 1, isActive: 1 }`.

---

## 2. Collection Schemas & Relationships

### 2.1 `users` Collection
- `_id`: ObjectId
- `email`: String (Unique, Indexed, Lowercase)
- `password`: String (`select: false`)
- `name`: String
- `role`: Enum (`user`, `admin`, default `user`)
- `isEmailVerified`: Boolean (default `false`)
- `verificationToken`: String (`select: false`)
- `verificationTokenExpires`: Date (`select: false`)
- `resetPasswordToken`: String (`select: false`)
- `resetPasswordExpires`: Date (`select: false`)
- `refreshTokenHash`: String (`select: false`)
- `preferredLanguage`: String (default `'en'`)
- `onboarding`: Embedded physical stats (age, sex, height, weight, activityLevel, goal, dietGoal, BMR, TDEE, macros)

### 2.2 `exercises` Collection (1,324 Movements)
- `_id`: ObjectId
- `exerciseId`: String (Unique, Indexed, e.g. `'0001'`)
- `name`: String (Indexed)
- `bodyPart`: String (Indexed, lowercase, e.g. `'chest'`, `'back'`)
- `target`: String (Indexed, lowercase, e.g. `'pectorals'`, `'abs'`)
- `equipment`: String (Indexed, lowercase, e.g. `'body weight'`, `'barbell'`)
- `muscleGroup`: String
- `secondary`: Array of Strings
- `image`: String path
- `gif`: String path
- `steps`: Array of English instruction strings
- `i18n`: Localized instruction dictionary (`ur`, `es`, `fr`, `de`, `it`, `tr`, `ru`, `pl`, `hi`, `zh`, `ko`)

### 2.3 `exercisefavorites` Collection
- `userId`: ObjectId (ref: `User`)
- `exerciseId`: String
- Unique index: `{ userId: 1, exerciseId: 1 }`

### 2.4 `workouts` Collection
- `userId`: ObjectId (ref: `User`)
- `name`: String (default `'My Workout'`)
- `isTemplate`: Boolean (default `false`)
- `items`: Array of embedded subdocuments:
  - `uid`: String
  - `exerciseId`: String
  - `sets`: Array of `{ id, reps, weight, done }`

### 2.5 `plans` Collection (9 Pre-Built Programs)
- `planId`: String (Unique, Indexed, e.g. `'abs-building'`)
- `key`: String (Category key, e.g. `'abs'`)
- `name`: String
- `tagline`: String
- `weeks`: Number (default `6`)
- `frequency`: String
- `level`: String
- `targetMuscle`: String
- `image`: String
- `accentColor`: String
- `description`: String
- `overview`: Array of `{ label, value }`
- `schedule`: Array of `{ day, title, focus, isRest, exerciseIds }`

### 2.6 `useractiveplans` Collection
- `userId`: ObjectId (ref: `User`)
- `planId`: String (ref: `Plan`)
- `currentWeek`: Number (default `1`)
- `currentDayIndex`: Number (0-6, default `0`)
- `daysPerWeek`: Number (2-6, default `4`)
- `completedDates`: Array of `YYYY-MM-DD` strings
- `lastWorkoutDate`: String
- `enrolledAt`: Date
- `completedAt`: Date (Nullable)
- `isActive`: Boolean (default `true`)

### 2.7 `workoutsessions` Collection (Phase 5)
- `userId`: ObjectId (ref: `User`, Indexed)
- `planId`: String (Nullable)
- `dateKey`: String (e.g. `'2026-11-25'`, Indexed)
- `name`: String
- `durationSeconds`: Number
- `totalVolumeKg`: Number
- `completedSets`: Number
- `completedReps`: Number
- `prsCount`: Number
- `trainedTargets`: Array of Strings
- `exerciseSnapshots`: JSON/Array of completed movements and sets
- `completedAt`: Date

### 2.8 `meals`, `usermeallogs`, `usermealfavorites` (Phase 6)
- 28 meal recipes, daily meal logging against calorie/macro targets, and user favorites.
