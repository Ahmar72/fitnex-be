# Fitnex — Feature Specifications (FEATURES.md)

This document provides a feature-by-feature breakdown of all Fitnex capabilities.

---

## 1. Authentication & Security
- **Email & Password Registration:** Validated format, minimum 8 characters, upper/lowercase, number, symbol.
- **6-Digit OTP Verification:** Instant email delivery via Mailtrap SMTP with 24-hour expiration token. Auto-login upon verification.
- **Stateless JWT Sessions:** 15-minute access token + 7-day secure refresh token rotation.
- **Password Recovery Flow:** Forgot password OTP dispatch, token verification, and automated token revocation upon password change.

---

## 2. Onboarding & Metabolic Engine
- **Stateless Metabolic Calculator:** Real-time computation using the Mifflin-St Jeor equation:
  - BMR for Male: $10 \times \text{wt} + 6.25 \times \text{ht} - 5 \times \text{age} + 5$
  - BMR for Female: $10 \times \text{wt} + 6.25 \times \text{ht} - 5 \times \text{age} - 161$
  - TDEE with physical activity multiplier (Sedentary, Light, Moderate, Very Active, Extra Active).
  - Goal Calorie Modifier: Weight Loss (-500 kcal, min 1200), Gain (+350 kcal), Maintenance (TDEE).
  - Goal-Calibrated Macronutrients: 30% Protein (4 kcal/g), 40% Carbs (4 kcal/g), 30% Fat (9 kcal/g).
- **Profile Persistence:** Stores onboarding physical statistics and goals directly into user profile.

---

## 3. Exercise Movement Catalog
- **1,324 Movement Database:** Comprehensive indexed movements with anatomical classifications.
- **Taxonomy Facet Aggregation:** Instant counts across body parts (chest, back, upper legs, waist, etc.), target muscles (pectorals, lats, quads, abs), and equipment.
- **Multi-Lingual Instruction Guides:** Localized guides in 10 languages (`en`, `ur`, `es`, `fr`, `de`, `it`, `tr`, `ru`, `pl`, `hi`, `zh`, `ko`).
- **User Bookmarking:** Toggle and persist favorite exercises per user account.

---

## 4. Workout Builder & Custom Routines
- **Active Draft Sync:** Real-time saving of builder state with exercise items, target reps, and weights.
- **Default Weight Intelligence:** Automatically initializes 0 kg for body weight movements and 20 kg for weighted barbell/dumbbell movements.
- **Set & Rep Customization:** Add, remove, update reps and weights per individual set.
- **Routine Template Loader:** Instantly loads pre-configured routine splits into the builder draft.

---

## 5. Training Plans & Programs Engine
- **9 Pre-Built Scientific Programs:**
  1. Six-Pack Abs & Core Chisel
  2. Biceps Peak & Arm Mastery
  3. Triceps Mass & Horseshoe Definition
  4. 3D Boulder Shoulders & Upper Frame
  5. Quads & Leg Dominance
  6. Spartan Chest Armor & Push Power
  7. V-Taper Back Wings & Pull Mastery
  8. Total Body Muscle Building Hypertrophy
  9. High-Metabolism Athletic Weight Loss
- **Continuous Progression:** Automatically manages current week (1-6) and current day index (0-6).
- **Enrollment Management:** Single active enrolled plan per user with one-click cancellation.

---

## 6. Workout History, PRs & Analytics (Phase 5)
- **Live Session Logging:** Duration, volume lifted (kg), total sets, reps, and muscle groups worked.
- **Personal Records (PRs):** Automatic record tracking for highest single-set weight and maximum volume per exercise.
- **Training Streak Calculation:** Consecutive training days tracker.

---

## 7. Nutrition & Meal Planning (Phase 6)
- **28 Chef-Curated Recipes:** Macro-balanced meal options covering breakfast, lunch, dinner, and snacks.
- **Daily Meal Consumption Log:** Logs consumed meals against user's daily calorie and macro target.
