const mongoose = require('mongoose');

async function migrateAllNested() {
  await mongoose.connect('mongodb://localhost:27017/fitnex');
  const db = mongoose.connection.db;
  console.log('Connected to MongoDB. Starting full nested-object normalization...');

  // 1. workout_session_exercises -> workout_session_sets + clean workout_sessions
  const sessionsCol = db.collection('workout_sessions');
  const sessionExCol = db.collection('workout_session_exercises');
  const sessionSetsCol = db.collection('workout_session_sets');

  const existingSessionExs = await sessionExCol.find({}).toArray();
  const sessionSetDocs = [];
  for (const se of existingSessionExs) {
    if (Array.isArray(se.sets) && se.sets.length > 0) {
      se.sets.forEach((s, idx) => {
        sessionSetDocs.push({
          sessionExerciseId: se._id,
          sessionId: se.sessionId,
          userId: se.userId,
          exerciseId: se.exerciseId,
          setNumber: s.setNumber || idx + 1,
          reps: s.reps || 10,
          weight: s.weight || 0,
          isPR: Boolean(s.isPR),
          createdAt: se.createdAt || new Date(),
          updatedAt: se.updatedAt || new Date(),
        });
      });
    }
  }
  if (sessionSetDocs.length > 0) {
    await sessionSetsCol.deleteMany({});
    await sessionSetsCol.insertMany(sessionSetDocs);
    console.log('Inserted', sessionSetDocs.length, 'docs into workout_session_sets.');
  }
  await sessionExCol.updateMany({}, { $unset: { sets: '' } });
  await sessionsCol.updateMany({}, { $unset: { exerciseSnapshots: '' } });
  console.log('Cleaned sets from workout_session_exercises and exerciseSnapshots from workout_sessions.');

  // 2. workout_items -> workout_item_sets + clean workouts
  const workoutsCol = db.collection('workouts');
  const workoutItemsCol = db.collection('workout_items');
  const workoutItemSetsCol = db.collection('workout_item_sets');

  const existingWorkoutItems = await workoutItemsCol.find({}).toArray();
  const workoutItemSetDocs = [];
  for (let i = 0; i < existingWorkoutItems.length; i++) {
    const wi = existingWorkoutItems[i];
    if (Array.isArray(wi.sets) && wi.sets.length > 0) {
      wi.sets.forEach((s, idx) => {
        workoutItemSetDocs.push({
          workoutItemId: wi._id,
          workoutId: wi.workoutId,
          userId: wi.userId,
          exerciseId: wi.exerciseId,
          setId: s.id || `set_${Date.now()}_${idx}`,
          setNumber: idx + 1,
          reps: s.reps || 10,
          weight: s.weight || 0,
          done: Boolean(s.done),
          createdAt: wi.createdAt || new Date(),
          updatedAt: wi.updatedAt || new Date(),
        });
      });
    }
    await workoutItemsCol.updateOne({ _id: wi._id }, { $set: { order: wi.order ?? i }, $unset: { sets: '' } });
  }
  if (workoutItemSetDocs.length > 0) {
    await workoutItemSetsCol.deleteMany({});
    await workoutItemSetsCol.insertMany(workoutItemSetDocs);
    console.log('Inserted', workoutItemSetDocs.length, 'docs into workout_item_sets.');
  }
  await workoutsCol.updateMany({}, { $unset: { items: '' } });
  console.log('Cleaned sets from workout_items and items from workouts.');

  // 3. plans -> plan_overviews & plan_schedules
  const plansCol = db.collection('plans');
  const planOverviewsCol = db.collection('plan_overviews');
  const planSchedulesCol = db.collection('plan_schedules');

  const allPlans = await plansCol.find({}).toArray();
  const overviewDocs = [];
  const scheduleDocs = [];
  for (const p of allPlans) {
    if (Array.isArray(p.overview)) {
      p.overview.forEach((ov, idx) => {
        overviewDocs.push({
          planId: p._id,
          planSlug: p.planId,
          label: ov.label,
          value: ov.value,
          order: idx,
          createdAt: p.createdAt || new Date(),
          updatedAt: p.updatedAt || new Date(),
        });
      });
    }
    if (Array.isArray(p.schedule)) {
      p.schedule.forEach((sc, idx) => {
        scheduleDocs.push({
          planId: p._id,
          planSlug: p.planId,
          dayIndex: idx,
          day: sc.day,
          title: sc.title,
          focus: sc.focus || '',
          isRest: Boolean(sc.isRest),
          exerciseIds: sc.exerciseIds || [],
          createdAt: p.createdAt || new Date(),
          updatedAt: p.updatedAt || new Date(),
        });
      });
    }
  }
  if (overviewDocs.length > 0) {
    await planOverviewsCol.deleteMany({});
    await planOverviewsCol.insertMany(overviewDocs);
    console.log('Inserted', overviewDocs.length, 'docs into plan_overviews.');
  }
  if (scheduleDocs.length > 0) {
    await planSchedulesCol.deleteMany({});
    await planSchedulesCol.insertMany(scheduleDocs);
    console.log('Inserted', scheduleDocs.length, 'docs into plan_schedules.');
  }
  await plansCol.updateMany({}, { $unset: { overview: '', schedule: '' } });
  console.log('Cleaned overview and schedule from plans.');

  // 4. meals -> meal_ingredients & flat macros
  const mealsCol = db.collection('meals');
  const mealIngredientsCol = db.collection('meal_ingredients');

  const allMeals = await mealsCol.find({}).toArray();
  const ingredientDocs = [];
  for (const m of allMeals) {
    if (Array.isArray(m.ingredients)) {
      m.ingredients.forEach((ing, idx) => {
        ingredientDocs.push({
          mealId: m._id,
          mealSlug: m.mealId,
          name: ing.name,
          weight: String(ing.weight ?? ''),
          unit: ing.unit || '',
          order: idx,
          createdAt: m.createdAt || new Date(),
          updatedAt: m.updatedAt || new Date(),
        });
      });
    }
    if (m.macros && typeof m.macros === 'object') {
      await mealsCol.updateOne(
        { _id: m._id },
        {
          $set: {
            calories: m.macros.calories ?? 0,
            protein: m.macros.protein ?? 0,
            carbs: m.macros.carbs ?? 0,
            fat: m.macros.fat ?? 0,
            fiber: m.macros.fiber ?? 0,
          },
          $unset: { macros: '', ingredients: '' },
        },
      );
    } else {
      await mealsCol.updateOne({ _id: m._id }, { $unset: { ingredients: '' } });
    }
  }
  if (ingredientDocs.length > 0) {
    await mealIngredientsCol.deleteMany({});
    await mealIngredientsCol.insertMany(ingredientDocs);
    console.log('Inserted', ingredientDocs.length, 'docs into meal_ingredients.');
  }
  console.log('Flattened macros and cleaned ingredients from meals.');

  // 5. exercises -> exercise_translations
  const exercisesCol = db.collection('exercises');
  const exTranslationsCol = db.collection('exercise_translations');

  const allExercises = await exercisesCol.find({ i18n: { $exists: true } }).toArray();
  const translationDocs = [];
  for (const ex of allExercises) {
    if (ex.i18n && typeof ex.i18n === 'object') {
      for (const [lang, steps] of Object.entries(ex.i18n)) {
        if (Array.isArray(steps)) {
          translationDocs.push({
            exerciseId: ex._id,
            language: lang,
            steps,
            createdAt: ex.createdAt || new Date(),
            updatedAt: ex.updatedAt || new Date(),
          });
        }
      }
    }
  }
  if (translationDocs.length > 0) {
    await exTranslationsCol.deleteMany({});
    await exTranslationsCol.insertMany(translationDocs);
    console.log('Inserted', translationDocs.length, 'docs into exercise_translations.');
  }
  await exercisesCol.updateMany({}, { $unset: { i18n: '' } });
  console.log('Cleaned i18n from exercises.');

  // 6. users -> flatten profile
  const usersCol = db.collection('users');
  const allUsers = await usersCol.find({ profile: { $exists: true } }).toArray();
  for (const u of allUsers) {
    await usersCol.updateOne(
      { _id: u._id },
      {
        $set: {
          goal: u.profile?.goal || u.goal || 'muscle',
          level: u.profile?.level || u.level || 'intermediate',
        },
        $unset: { profile: '' },
      },
    );
  }
  console.log('Flattened profile on users.');

  await mongoose.disconnect();
  console.log('Full nested-object DB normalization completed successfully!');
}

migrateAllNested().catch((err) => {
  console.error(err);
  process.exit(1);
});
