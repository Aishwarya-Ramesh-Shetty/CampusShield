import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import User from '../src/models/User.js';

const seedUsers = [
  { name: 'Development Student', email: 'student@example.com', password: 'StudentDev!2026', role: 'student', studentId: 'DEV-STUDENT-001' },
  { name: 'Development Admin', email: 'admin@example.com', password: 'AdminDev!2026', role: 'admin', studentId: '' },
  { name: 'Development Assessor', email: 'security@example.com', password: 'SecurityDev!2026', role: 'security_assessor', studentId: '' },
];

if (process.env.NODE_ENV !== 'development') {
  console.error('Refusing to seed: set NODE_ENV=development explicitly.');
  process.exitCode = 1;
} else {
  try {
    await connectDatabase(env.mongodbUri);
    for (const seedUser of seedUsers) {
      const password = await bcrypt.hash(seedUser.password, 12);
      await User.updateOne(
        { email: seedUser.email },
        { $set: { ...seedUser, password } },
        { upsert: true, runValidators: true },
      );
    }
    console.log('Development users seeded. Their sample passwords are documented in README.md.');
  } catch (error) {
    console.error(`Development seed failed (${error.name}). Check MongoDB configuration and availability.`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}