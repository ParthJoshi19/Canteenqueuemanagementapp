import { connectDB } from '../config/db';
import { User } from '../models/User';
import dotenv from 'dotenv';
dotenv.config();
async function seedAdmin() {
  await connectDB();

  const existing = await User.findOne({ role: 'admin' });
  if (existing) {
    console.log(`Admin user already exists: ${existing.username}`);
    process.exit(0);
  }

  const admin = await User.create({
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    displayName: 'Administrator',
    profileCompleted: true,
  });

  console.log(`Admin user created: ${admin.username} (password: admin123)`);
  console.log('⚠️  Change the default password in production!');
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('Failed to seed admin:', err);
  process.exit(1);
});
