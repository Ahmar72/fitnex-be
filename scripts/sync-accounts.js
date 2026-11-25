const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function sync() {
  await mongoose.connect('mongodb://localhost:27017/fitnex');
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Password123!', salt);

  // Update ahmar@123.com
  await mongoose.connection.db.collection('users').updateOne(
    { email: 'ahmar@123.com' },
    { $set: { password: hash, isActive: true, isEmailVerified: true } }
  );

  // Upsert ahmer@123.com so any spelling variant works
  await mongoose.connection.db.collection('users').updateOne(
    { email: 'ahmer@123.com' },
    {
      $set: {
        name: 'ahmar',
        password: hash,
        isActive: true,
        isEmailVerified: true,
        role: 'user',
        preferredLanguage: 'en',
        updatedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    },
    { upsert: true }
  );

  console.log('SYNC_SUCCESS: Both ahmar@123.com and ahmer@123.com updated with Password123! and active verified status.');
  await mongoose.disconnect();
}

sync().catch(err => {
  console.error(err);
  process.exit(1);
});
