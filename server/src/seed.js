import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, Settings, MenuItem } from './models.js';

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) { console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ chars)'); process.exit(1); }
await mongoose.connect(process.env.MONGO_URI);
const email = ADMIN_EMAIL.toLowerCase();
const u = await User.findOne({ email });
if (u) { u.role = 'admin'; await u.save(); console.log('Existing user promoted to admin'); }
else { await User.create({ name: 'Admin', email, password: await bcrypt.hash(ADMIN_PASSWORD, 12), role: 'admin' }); console.log('Admin created'); }
if (!(await Settings.findOne())) await Settings.create({});
if (!(await MenuItem.countDocuments())) await MenuItem.insertMany([
  { name: 'Ragi Idli (4 pcs)', description: 'Steamed ragi idli with sambar and chutney', price: 60, tags: ['Millet', 'High fibre'], nutrition: '210 kcal · 7g protein' },
  { name: 'Veg Oats Upma', description: 'Oats upma with seasonal vegetables', price: 55, tags: ['Low oil'], nutrition: '190 kcal · 6g protein' },
  { name: 'Kambu Dosa (2 pcs)', description: 'Pearl millet dosa with coconut chutney', price: 65, tags: ['Millet', 'Gluten-light'], nutrition: '230 kcal · 8g protein' },
]);
console.log('Seed done'); await mongoose.disconnect();
