const http = require('http');

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

function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAIL:', message);
    throw new Error(message);
  }
  console.log('✅ PASS:', message);
}

async function runRegression() {
  console.log('========================================================');
  console.log('   FITNEX FULL REPO REGRESSION TEST SUITE (PHASES 1-6)  ');
  console.log('========================================================');

  // Phase 1: Health & System Diagnostics
  const health = await request('/health');
  assert(health.status === 200 && health.body.data.status === 'healthy', 'Phase 1: Health check');

  // Phase 2: Auth, User Profile & Settings
  const login = await request('/auth/login', {
    method: 'POST',
    body: { email: 'athlete@fitnex.com', password: 'Password123!' },
  });
  assert(login.status === 200 && login.body.data.accessToken, 'Phase 2: Login authentication');
  const token = login.body.data.accessToken;

  const me = await request('/users/me', { token });
  assert(me.status === 200 && me.body.data.email === 'athlete@fitnex.com', 'Phase 2: Authenticated /users/me');

  // Phase 3: Metabolic Engine & Onboarding
  const calc = await request('/onboarding/calculate', {
    method: 'POST',
    body: { age: 26, sex: 'male', weight: 75, weightUnit: 'kg', height: 178, heightUnit: 'cm', activityLevel: 'moderate', dietGoal: 'gain' },
  });
  assert(calc.status === 200 && calc.body.data.targetCalories > 2000, 'Phase 3: Metabolic calculation');

  // Phase 4: Exercises Catalog & Facets
  const exercises = await request('/exercises?page=1&limit=10');
  assert(exercises.status === 200 && exercises.body.data.total === 1324, 'Phase 4: Exercises catalog (1,324 movements)');

  const facets = await request('/exercises/facets');
  assert(facets.status === 200 && facets.body.data.bodyParts.length > 5, 'Phase 4: Taxonomy facets');

  // Phase 4b: Workout Builder & Training Plans
  const currentWorkout = await request('/workouts/current', { token });
  assert(currentWorkout.status === 200 && currentWorkout.body.data.name !== undefined, 'Phase 4b: Workout builder draft');

  const plans = await request('/plans');
  assert(plans.status === 200 && plans.body.data.length === 9, 'Phase 4b: Training plans (9 plans)');

  // Phase 5: Workout Sessions, Streak, PRs & Dashboard
  const streak = await request('/history/streak', { token });
  assert(streak.status === 200 && streak.body.data.streak !== undefined, 'Phase 5: Streak calculation');

  const prs = await request('/history/prs', { token });
  assert(prs.status === 200 && Array.isArray(prs.body.data), 'Phase 5: Personal records');

  const dashboard = await request('/dashboard/summary', { token });
  assert(dashboard.status === 200 && dashboard.body.data.streak !== undefined, 'Phase 5: Dashboard summary integration');

  // Phase 6: Nutrition Catalog & Meal Tracking
  const meals = await request('/meals?page=1&limit=10');
  assert(meals.status === 200 && meals.body.data.total === 52, 'Phase 6: Chef-curated recipes (52 meals)');

  const categories = await request('/meals/categories');
  assert(categories.status === 200 && categories.body.data.length === 7, 'Phase 6: Recipe categories (7 categories)');

  const dailySummary = await request('/meals/daily-summary', { token });
  assert(dailySummary.status === 200 && dailySummary.body.data.targets.calories > 0, 'Phase 6: Daily calorie summary');

  console.log('========================================================');
  console.log('   🎉 ALL 12/12 REGRESSION CHECKS PASSED FLAWLESSLY!   ');
  console.log('========================================================');
}

runRegression().catch(err => {
  console.error('Regression suite failed:', err);
  process.exit(1);
});
