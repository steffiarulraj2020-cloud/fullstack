import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import auth from './routes/auth.js';
import pub from './routes/public.js';
import admin from './routes/admin.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.get('/health', (q, s) => s.send('ok'));
app.use('/api/auth', auth);
app.use('/api/admin', admin);
app.use('/api', pub);
app.use((e, q, s, n) => {
  if (e.name === 'ZodError') return s.status(400).json({ error: e.issues[0].message });
  if (e.name === 'CastError') return s.status(400).json({ error: 'Invalid id' });
  if (e.code === 11000) return s.status(409).json({ error: 'Already exists' });
  if (!e.status) console.error(e);
  s.status(e.status || 500).json({ error: e.status ? e.message : 'Server error' });
});
mongoose.connect(process.env.MONGO_URI).then(() =>
  app.listen(process.env.PORT || 5000, () => console.log('API up')));
