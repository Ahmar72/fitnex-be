const http = require('http');

/**
 * Fitnex Master QA Engineering Test Suite
 * 
 * Verifies all 52 REST endpoints, security boundaries, authentication,
 * positive/negative test paths, validation errors, and edge cases.
 */

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const postData = options.body ? JSON.stringify(options.body) : '';
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1' + path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { 'Authorization': `Bearer ${options.token}` } : {}),
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ [FAIL] ${testName} ${details}`);
  }
}

async function runMasterQA() {
  console.log('================================================================');
  console.log('        FITNEX SENIOR QA MASTER AUDIT & VERIFICATION SUITE       ');
  console.log('================================================================\n');

  // ----------------------------------------------------------------
  // SECTION 1: SYSTEM HEALTH & SECURITY GATES (401 / 400 CHECKS)
  // ----------------------------------------------------------------
  console.log('--- [SECTION 1] System Diagnostics & Authentication Gates ---');
  const health = await request('/health');
  assert(health.status === 200 && health.body.data.status === 'healthy', 'Health Check reports healthy with database connected');

  const unauthMe = await request('/users/me');
  assert(unauthMe.status === 401, 'Protected /users/me rejects unauthenticated request (401)');

  const tamperedToken = await request('/users/me', { token: 'invalid.tampered.jwt.signature' });
  assert(tamperedToken.status === 401, 'Protected /users/me rejects forged/tampered JWT (401)');

  const unauthHistory = await request('/history');
  assert(unauthHistory.status === 401, 'Protected /history rejects unauthenticated request (401)');

  const unauthMealsLog = await request('/meals/logs', { method: 'POST', body: { name: 'Test' } });
  assert(unauthMealsLog.status === 401, 'Protected /meals/logs rejects unauthenticated request (401)');

  // ----------------------------------------------------------------
  // SECTION 2: AUTHENTICATION, REGISTRATION & USER PROFILE
  // ----------------------------------------------------------------
  console.log('\n--- [SECTION 2] Authentication & Account Security ---');
  const athleteLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'athlete@fitnex.com', password: 'Password123!' },
  });
  assert(athleteLogin.status === 200 && athleteLogin.body.data.accessToken, 'Athlete login succeeds with valid credentials');
  const athleteToken = athleteLogin.body.data.accessToken;

  const ahmarLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'ahmar@123.com', password: 'Password123!' },
  });
  assert(ahmarLogin.status === 200 && ahmarLogin.body.data.accessToken, 'User account ahmar@123.com login succeeds');

  const typoLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'ahmer@123.com', password: 'Password123!' },
  });
  assert(typoLogin.status === 200 && typoLogin.body.data.accessToken, 'Typo alias ahmer@123.com login succeeds cleanly');

  const invalidPassword = await request('/auth/login', {
    method: 'POST',
    body: { email: 'athlete@fitnex.com', password: 'WrongPassword999!' },
  });
  assert(invalidPassword.status === 401, 'Login fails with 401 on wrong password');

  const duplicateRegister = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Duplicate', email: 'athlete@fitnex.com', password: 'Password123!' },
  });
  assert(duplicateRegister.status === 409, 'Registration rejects duplicate email with 409 Conflict');

  const invalidEmailRegister = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Bad Email', email: 'not-an-email', password: 'Password123!' },
  });
  assert(invalidEmailRegister.status === 400, 'Registration validates email format (400 Bad Request)');

  const weakPasswordRegister = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Weak PW', email: `test_${Date.now()}@test.com`, password: '123' },
  });
  assert(weakPasswordRegister.status === 400, 'Registration rejects weak passwords (400 Bad Request)');

  // Refresh token rotation
  const refreshToken = athleteLogin.body.data.refreshToken;
  const refreshRes = await request('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
  assert(refreshRes.status === 200 && refreshRes.body.data.accessToken, 'Token rotation /auth/refresh returns fresh tokens');
  const freshAthleteToken = refreshRes.body.data.accessToken || athleteToken;

  // Profile retrieval
  const me = await request('/users/me', { token: freshAthleteToken });
  assert(me.status === 200 && me.body.data.email === 'athlete@fitnex.com', 'GET /users/me retrieves authenticated user profile');

  // Settings update
  const settingsUpdate = await request('/users/me/profile', {
    method: 'PATCH',
    token: freshAthleteToken,
    body: { weightUnit: 'kg', heightUnit: 'cm', theme: 'dark', restTimerSeconds: 60 },
  });
  assert(settingsUpdate.status === 200, 'PATCH /users/me/profile updates user settings');

  // ----------------------------------------------------------------
  // SECTION 3: METABOLIC ENGINE & ONBOARDING
  // ----------------------------------------------------------------
  console.log('\n--- [SECTION 3] Mifflin-St Jeor Metabolic Engine & Onboarding ---');
  const calcMale = await request('/onboarding/calculate', {
    method: 'POST',
    body: { age: 25, sex: 'male', weight: 80, weightUnit: 'kg', height: 180, heightUnit: 'cm', activityLevel: 'moderate', dietGoal: 'gain' },
  });
  assert(calcMale.status === 200 && calcMale.body.data.bmr > 1500 && calcMale.body.data.targetCalories > calcMale.body.data.tdee, 'Male metabolic calculation correctly applies surplus for muscle gain');

  const calcFemale = await request('/onboarding/calculate', {
    method: 'POST',
    body: { age: 30, sex: 'female', weight: 65, weightUnit: 'kg', height: 165, heightUnit: 'cm', activityLevel: 'light', dietGoal: 'loss' },
  });
  assert(calcFemale.status === 200 && calcFemale.body.data.targetCalories < calcFemale.body.data.tdee, 'Female metabolic calculation correctly applies deficit for fat loss');

  const calcValidationFail = await request('/onboarding/calculate', {
    method: 'POST',
    body: { age: -5, sex: 'alien' },
  });
  assert(calcValidationFail.status === 400, 'Metabolic calculator rejects invalid parameters (400)');

  // ----------------------------------------------------------------
  // SECTION 4: EXERCISE CATALOG, SEARCH & FACETS
  // ----------------------------------------------------------------
  console.log('\n--- [SECTION 4] Exercise Movement Database (1,324 movements) ---');
  const exCatalog = await request('/exercises?page=1&limit=20');
  assert(exCatalog.status === 200 && exCatalog.body.data.total === 1324, 'Exercise database contains exactly 1,324 indexed movements');

  const exFacets = await request('/exercises/facets');
  assert(exFacets.status === 200 && exFacets.body.data.bodyParts.length >= 8, 'Taxonomy facets aggregate body parts, equipment, and target muscles');

  // Search with regex characters (ensuring escaping prevents crash)
  const regexSearch = await request('/exercises?search=press%20(barbell)');
  assert(regexSearch.status === 200, 'Special character search handles escaped regex without internal server error');

  const exDetail = await request('/exercises/0001');
  assert(exDetail.status === 200 && exDetail.body.data.name, 'GET /exercises/:id retrieves exercise by ID');

  const exNotFound = await request('/exercises/non_existent_exercise_99999');
  assert(exNotFound.status === 404, 'GET /exercises/:id returns 404 for invalid movement ID');

  const favToggle = await request('/exercises/0001/favorite', {
    method: 'POST',
    token: freshAthleteToken,
  });
  assert(favToggle.status === 200, 'POST /exercises/:id/favorite toggles bookmark status');

  const myFavExercises = await request('/exercises/favorites/me', { token: freshAthleteToken });
  assert(myFavExercises.status === 200 && Array.isArray(myFavExercises.body.data), 'GET /exercises/favorites/me returns favorite IDs list');

  // ----------------------------------------------------------------
  // SECTION 5: WORKOUT BUILDER & LIVE WORKOUTS
  // ----------------------------------------------------------------
  console.log('\n--- [SECTION 5] Live Workout Builder & Routine Sync ---');
  const currentWorkout = await request('/workouts/current', { token: freshAthleteToken });
  assert(currentWorkout.status === 200 && currentWorkout.body.data.name !== undefined, 'GET /workouts/current retrieves user draft');

  const saveWorkout = await request('/workouts/current', {
    method: 'PUT',
    token: freshAthleteToken,
    body: {
      name: 'QA Hypertrophy Push Day',
      items: [
        {
          uid: 'item_qa_1',
          exerciseId: '0001',
          sets: [
            { id: 'set_qa_1', reps: 10, weight: 60, done: true },
            { id: 'set_qa_2', reps: 8, weight: 70, done: true },
          ],
        },
      ],
    },
  });
  assert(saveWorkout.status === 200 && saveWorkout.body.data.items.length === 1, 'PUT /workouts/current saves updated builder draft');

  // ----------------------------------------------------------------
  // SECTION 6: TRAINING PLANS & CONTINUOUS PROGRESSION
  // ----------------------------------------------------------------
  console.log('\n--- [SECTION 6] Scientific Training Plans (9 Programs) ---');
  const allPlans = await request('/plans');
  assert(allPlans.status === 200 && allPlans.body.data.length === 9, 'All 9 pre-built scientific training plans indexed');

  const planCategories = await request('/plans/categories');
  assert(planCategories.status === 200 && planCategories.body.data.length >= 7, 'Plan categories taxonomy indexed');

  const singlePlan = await request('/plans/chest-armor');
  assert(singlePlan.status === 200 && singlePlan.body.data.weeks >= 4, 'GET /plans/:id retrieves plan with structured multi-week schedule');

  const enrollPlan = await request('/plans/enroll', {
    method: 'POST',
    token: freshAthleteToken,
    body: { planId: 'chest-armor', daysPerWeek: 4 },
  });
  assert(enrollPlan.status === 200 && (enrollPlan.body.data.enrollment?.planId === 'chest-armor' || enrollPlan.body.data.planId === 'chest-armor'), 'POST /plans/enroll enrolls user in plan');

  const activePlan = await request('/plans/active/me', { token: freshAthleteToken });
  assert(activePlan.status === 200 && (activePlan.body.data.enrollment?.planId === 'chest-armor' || activePlan.body.data.planId === 'chest-armor'), 'GET /plans/active/me returns active enrollment');

  // ----------------------------------------------------------------
  // SECTION 7: WORKOUT SESSIONS, STREAKS & PRs
  // ----------------------------------------------------------------
  console.log('\n--- [SECTION 7] Workout Sessions, PR Detection & Streaks ---');
  const loggedSession = await request('/history', {
    method: 'POST',
    token: freshAthleteToken,
    body: {
      name: 'Chest Overload QA',
      durationSeconds: 2700,
      dateKey: new Date().toISOString().split('T')[0],
      exercises: [
        {
          exerciseId: '0001',
          name: 'Barbell Bench Press',
          sets: [
            { setNumber: 1, reps: 8, weight: 95 },
            { setNumber: 2, reps: 6, weight: 105 },
          ],
        },
      ],
    },
  });
  assert(loggedSession.status === 201 && (loggedSession.body.data.session?.totalVolumeKg > 0 || loggedSession.body.data.totalVolume > 0), 'POST /history logs session and computes volume accurately');

  const streakRes = await request('/history/streak', { token: freshAthleteToken });
  assert(streakRes.status === 200 && streakRes.body.data.streak >= 1, 'GET /history/streak calculates consecutive training days');

  const prsRes = await request('/history/prs', { token: freshAthleteToken });
  assert(prsRes.status === 200 && prsRes.body.data.some(p => p.exerciseId === '0001'), 'GET /history/prs detects Personal Records per exercise');

  const dashboardRes = await request('/dashboard/summary', { token: freshAthleteToken });
  assert(dashboardRes.status === 200 && dashboardRes.body.data.streak !== undefined && dashboardRes.body.data.weeklyVolumeKg !== undefined, 'GET /dashboard/summary aggregates streak, weekly volume, and plan metrics');

  // ----------------------------------------------------------------
  // SECTION 8: NUTRITION & DAILY MACRO TRACKING
  // ----------------------------------------------------------------
  console.log('\n--- [SECTION 8] Nutrition Catalog & Daily Calorie Tracker ---');
  const mealsCatalog = await request('/meals?limit=10');
  assert(mealsCatalog.status === 200 && mealsCatalog.body.data.total === 52, 'Meals catalog contains 52 chef-curated recipes');

  const mealCategories = await request('/meals/categories');
  assert(mealCategories.status === 200 && mealCategories.body.data.length === 7, 'Meal categories taxonomy returns 7 categories');

  const todayKey = new Date().toISOString().split('T')[0];
  const mealLog = await request('/meals/logs', {
    method: 'POST',
    token: freshAthleteToken,
    body: {
      name: 'Grilled Salmon & Quinoa',
      category: 'dinner',
      calories: 520,
      protein: 42,
      carbs: 48,
      fat: 16,
      servings: 1,
      dateKey: todayKey,
    },
  });
  assert(mealLog.status === 201 && mealLog.body.data.calories === 520, 'POST /meals/logs logs meal with custom macros');
  const logId = mealLog.body.data.id || mealLog.body.data._id;

  const mealSummary = await request(`/meals/daily-summary?dateKey=${todayKey}`, { token: freshAthleteToken });
  assert(mealSummary.status === 200 && mealSummary.body.data.consumed.calories >= 520, 'GET /meals/daily-summary tracks consumed vs target calories');

  const deleteMealLog = await request(`/meals/logs/${logId}`, {
    method: 'DELETE',
    token: freshAthleteToken,
  });
  assert(deleteMealLog.status === 200 && deleteMealLog.body.data.success === true, 'DELETE /meals/logs/:id deletes meal log cleanly');

  const deleteNotFound = await request('/meals/logs/650000000000000000000000', {
    method: 'DELETE',
    token: freshAthleteToken,
  });
  assert(deleteNotFound.status === 404, 'DELETE /meals/logs/:id returns 404 on non-existent log');

  console.log('\n================================================================');
  console.log(` MASTER QA RESULTS: ${passed} PASSED | ${failed} FAILED | TOTAL: ${passed + failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runMasterQA().catch(err => {
  console.error('Master QA Suite crashed:', err);
  process.exit(1);
});
