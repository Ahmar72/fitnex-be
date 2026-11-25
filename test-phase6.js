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

async function run() {
  console.log('--- STARTING PHASE 6 NUTRITION & MEAL SUITE ---');

  // 1. Health check
  const health = await request('/health');
  assert(health.status === 200 && health.body.data.status === 'healthy', 'Health check healthy');

  // 2. Login as athlete
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'athlete@fitnex.com', password: 'Password123!' },
  });
  assert(loginRes.status === 200 && loginRes.body.data.accessToken, 'Athlete login successful');
  const token = loginRes.body.data.accessToken;

  // 3. Test Categories
  const catRes = await request('/meals/categories');
  assert(catRes.status === 200 && Array.isArray(catRes.body.data) && catRes.body.data.some(c => c.key === 'breakfast' || c === 'breakfast'), 'GET /meals/categories returns categories');

  // 4. Test Catalog pagination
  const mealsRes = await request('/meals?page=1&limit=10');
  assert(mealsRes.status === 200 && mealsRes.body.data.meals.length > 0, 'GET /meals returns paginated meals');
  assert(mealsRes.body.data.total >= 52, `GET /meals catalog contains at least 52 meals (found ${mealsRes.body.data.total})`);

  // 5. Test Filter by category
  const breakfastRes = await request('/meals?category=breakfast');
  assert(breakfastRes.status === 200 && breakfastRes.body.data.meals.every(m => m.category === 'breakfast'), 'Filter by category=breakfast works');

  // 6. Test Filter by keyword search
  const oatsRes = await request('/meals?search=oat');
  assert(oatsRes.status === 200 && oatsRes.body.data.meals.length > 0, 'Filter by search keyword works');

  // 7. Test Recipe details
  const sampleMeal = mealsRes.body.data.meals[0];
  const detailRes = await request(`/meals/${sampleMeal.mealId}`);
  assert(detailRes.status === 200 && detailRes.body.data.name === sampleMeal.name, 'GET /meals/:id retrieves detailed recipe');
  assert(Array.isArray(detailRes.body.data.ingredients), 'Recipe contains ingredients array');
  assert(detailRes.body.data.macros && detailRes.body.data.macros.calories > 0, 'Recipe contains calibrated macros');

  // 8. Test Favorites
  const favToggle1 = await request(`/meals/favorites/${sampleMeal.mealId}`, {
    method: 'POST',
    token,
  });
  assert(favToggle1.status === 200 && favToggle1.body.data.isFavorite === true, 'POST /meals/favorites/:id bookmarks recipe');

  const myFavs = await request('/meals/favorites/me', { token });
  assert(myFavs.status === 200 && myFavs.body.data.includes(sampleMeal.mealId), 'GET /meals/favorites/me includes favorited recipe');

  const favToggle2 = await request(`/meals/favorites/${sampleMeal.mealId}`, {
    method: 'POST',
    token,
  });
  assert(favToggle2.status === 200 && favToggle2.body.data.isFavorite === false, 'POST /meals/favorites/:id unbookmarks recipe');

  // 9. Test Log Meal
  const today = new Date().toISOString().split('T')[0];
  const logRes = await request('/meals/logs', {
    method: 'POST',
    token,
    body: {
      mealId: sampleMeal.mealId,
      name: sampleMeal.name,
      category: sampleMeal.category,
      calories: sampleMeal.macros.calories,
      protein: sampleMeal.macros.protein,
      carbs: sampleMeal.macros.carbs,
      fat: sampleMeal.macros.fat,
      servings: 1.5,
      dateKey: today,
    },
  });
  assert(logRes.status === 201 && logRes.body.data.calories > 0, 'POST /meals/logs records meal entry');
  const loggedMealId = logRes.body.data.id || logRes.body.data._id;

  // 10. Test Get Daily Logs
  const myLogs = await request(`/meals/logs/me?dateKey=${today}`, { token });
  assert(myLogs.status === 200 && myLogs.body.data.some(l => (l.id || l._id) === loggedMealId), 'GET /meals/logs/me returns today logs');

  // 11. Test Daily Summary
  const summaryRes = await request(`/meals/daily-summary?dateKey=${today}`, { token });
  assert(summaryRes.status === 200, 'GET /meals/daily-summary succeeds');
  assert(summaryRes.body.data.consumed.calories >= logRes.body.data.calories, 'Daily summary tracks consumed calories');
  assert(summaryRes.body.data.targets && summaryRes.body.data.targets.calories > 0, 'Daily summary includes target calories');
  assert(summaryRes.body.data.percentage && summaryRes.body.data.percentage.calories !== undefined, 'Daily summary includes percentage progress');

  // 12. Delete Logged Meal
  const delRes = await request(`/meals/logs/${loggedMealId}`, {
    method: 'DELETE',
    token,
  });
  assert(delRes.status === 200 && delRes.body.data.success === true, 'DELETE /meals/logs/:id removes meal log');

  console.log('--- ALL PHASE 6 NUTRITION & MEAL TESTS PASSED (12/12) ---');
}

run().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
