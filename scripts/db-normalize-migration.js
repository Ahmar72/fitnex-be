const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function migrate() {
  await mongoose.connect('mongodb://localhost:27017/fitnex');
  console.log('Connected to MongoDB for schema simplification and ObjectId normalization.');

  const exercisesCol = mongoose.connection.db.collection('exercises');
  const favCol = mongoose.connection.db.collection('exercise_favorites');
  const prCol = mongoose.connection.db.collection('personal_records');
  const workoutCol = mongoose.connection.db.collection('workouts');
  const sessionCol = mongoose.connection.db.collection('workout_sessions');
  const planCol = mongoose.connection.db.collection('plans');

  // 1. Build codeToObjId mapping
  const allExercises = await exercisesCol.find({}).project({ exerciseId: 1, _id: 1, name: 1, bodyPart: 1, target: 1 }).toArray();
  const codeToObjId = {};
  for (const ex of allExercises) {
    if (ex.exerciseId) {
      codeToObjId[ex.exerciseId] = ex._id;
    }
    codeToObjId[ex._id.toString()] = ex._id;
  }
  console.log('Mapped', Object.keys(codeToObjId).length, 'exercise identifiers to ObjectIds.');

  // Save map to file for backend fallback reference
  const mapPath = path.resolve(__dirname, '../src/common/legacy-exercise-map.json');
  fs.mkdirSync(path.dirname(mapPath), { recursive: true });
  const strMap = {};
  for (const k in codeToObjId) {
    strMap[k] = codeToObjId[k].toString();
  }
  fs.writeFileSync(mapPath, JSON.stringify(strMap, null, 2));
  console.log('Saved legacy fallback map to', mapPath);

  // 2. Normalize and populate workout_session_exercises collection
  const sessionExercisesCol = mongoose.connection.db.collection('workout_session_exercises');
  await sessionExercisesCol.deleteMany({});
  const allSessions = await sessionCol.find({}).toArray();
  let sessionExerciseDocs = [];

  for (const s of allSessions) {
    const updatedExercises = [];
    const updatedSnapshots = [];

    if (Array.isArray(s.exerciseSnapshots)) {
      for (const snap of s.exerciseSnapshots) {
        const rawId = snap.exerciseId?.toString?.() || snap.exerciseId;
        const targetObjId = codeToObjId[rawId] || (mongoose.Types.ObjectId.isValid(rawId) ? new mongoose.Types.ObjectId(rawId) : null);
        const resolvedId = targetObjId || rawId;
        if (targetObjId) {
          updatedExercises.push(targetObjId);
        }

        let totalVol = 0;
        let totalReps = 0;
        let maxWeight = 0;
        if (Array.isArray(snap.sets)) {
          snap.sets.forEach(st => {
            const r = Number(st.reps) || 0;
            const w = Number(st.weight) || 0;
            totalVol += r * w;
            totalReps += r;
            if (w > maxWeight) maxWeight = w;
          });
        }

        updatedSnapshots.push({
          exerciseId: resolvedId,
          name: snap.name,
          bodyPart: snap.bodyPart || '',
          target: snap.target || '',
          sets: snap.sets || []
        });

        if (targetObjId) {
          sessionExerciseDocs.push({
            sessionId: s._id,
            userId: s.userId,
            exerciseId: targetObjId,
            exerciseName: snap.name,
            bodyPart: snap.bodyPart || '',
            target: snap.target || '',
            setsCount: snap.sets?.length || 0,
            completedReps: totalReps,
            totalVolumeKg: Math.round(totalVol * 10) / 10,
            maxWeight,
            sets: snap.sets || [],
            createdAt: s.createdAt || new Date(),
            updatedAt: s.updatedAt || new Date()
          });
        }
      }
    }

    await sessionCol.updateOne(
      { _id: s._id },
      {
        $set: {
          exercises: updatedExercises,
          exerciseSnapshots: updatedSnapshots
        }
      }
    );
  }

  if (sessionExerciseDocs.length) {
    await sessionExercisesCol.insertMany(sessionExerciseDocs);
    console.log('Populated workout_session_exercises with', sessionExerciseDocs.length, 'records.');
  }

  // 3. Normalize and populate workout_items collection
  const workoutItemsCol = mongoose.connection.db.collection('workout_items');
  await workoutItemsCol.deleteMany({});
  const allWorkouts = await workoutCol.find({}).toArray();
  let workoutItemDocs = [];

  for (const w of allWorkouts) {
    const updatedItems = [];
    if (Array.isArray(w.items)) {
      for (const item of w.items) {
        const rawId = item.exerciseId?.toString?.() || item.exerciseId;
        const targetObjId = codeToObjId[rawId] || (mongoose.Types.ObjectId.isValid(rawId) ? new mongoose.Types.ObjectId(rawId) : null);
        const resolvedId = targetObjId || rawId;
        updatedItems.push({
          uid: item.uid,
          exerciseId: resolvedId,
          sets: item.sets || []
        });

        if (targetObjId) {
          workoutItemDocs.push({
            workoutId: w._id,
            userId: w.userId,
            exerciseId: targetObjId,
            uid: item.uid,
            sets: item.sets || [],
            createdAt: w.createdAt || new Date(),
            updatedAt: w.updatedAt || new Date()
          });
        }
      }
    }

    await workoutCol.updateOne(
      { _id: w._id },
      { $set: { items: updatedItems } }
    );
  }

  if (workoutItemDocs.length) {
    await workoutItemsCol.insertMany(workoutItemDocs);
    console.log('Populated workout_items with', workoutItemDocs.length, 'records.');
  }

  // 4. Migrate exercise_favorites to use ObjectIds
  const allFavs = await favCol.find({}).toArray();
  for (const f of allFavs) {
    const rawId = f.exerciseId?.toString?.() || f.exerciseId;
    const targetObjId = codeToObjId[rawId];
    if (targetObjId) {
      await favCol.updateOne({ _id: f._id }, { $set: { exerciseId: targetObjId } });
    }
  }
  console.log('Migrated exercise_favorites to ObjectIds.');

  // 5. Migrate personal_records to use ObjectIds
  const allPrs = await prCol.find({}).toArray();
  for (const p of allPrs) {
    const rawId = p.exerciseId?.toString?.() || p.exerciseId;
    const targetObjId = codeToObjId[rawId];
    if (targetObjId) {
      await prCol.updateOne({ _id: p._id }, { $set: { exerciseId: targetObjId } });
    }
  }
  console.log('Migrated personal_records to ObjectIds.');

  // 6. Migrate plans schedule to use ObjectIds
  const allPlans = await planCol.find({}).toArray();
  for (const plan of allPlans) {
    if (Array.isArray(plan.schedule)) {
      const updatedSchedule = plan.schedule.map(day => ({
        ...day,
        exerciseIds: (day.exerciseIds || []).map(id => {
          const rawId = id?.toString?.() || id;
          const target = codeToObjId[rawId];
          return target ? target.toString() : rawId;
        })
      }));
      await planCol.updateOne({ _id: plan._id }, { $set: { schedule: updatedSchedule } });
    }
  }
  console.log('Migrated plans schedule to ObjectIds.');

  // 7. Drop exerciseId index on exercises if exists, and unset exerciseId
  try {
    await exercisesCol.dropIndex('exerciseId_1');
    console.log('Dropped exerciseId_1 index.');
  } catch (e) {
    console.log('No exerciseId_1 index to drop:', e.message);
  }

  const unsetRes = await exercisesCol.updateMany({}, { $unset: { exerciseId: '' } });
  console.log('Unset exerciseId in exercises collection. Modified count:', unsetRes.modifiedCount);

  await mongoose.disconnect();
  console.log('Database normalization migration complete!');
}

migrate().catch(console.error);

