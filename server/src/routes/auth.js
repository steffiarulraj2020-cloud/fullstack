import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { User } from '../models.js';
import { verifyToken } from '../middleware.js';

const r = Router();
const prod = process.env.NODE_ENV === 'production';
const ck = (maxAge) => ({ httpOnly: true, secure: prod, sameSite: prod ? 'none' : 'lax', maxAge });
const setCookies = (s, u) => {
  s.cookie('access', jwt.sign({ id: u.id }, process.env.JWT_SECRET, { expiresIn: '15m' }), ck(15 * 60e3));
  s.cookie('refresh', jwt.sign({ id: u.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }), ck(7 * 864e5));
};
const pub = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });
const limiter = rateLimit({ windowMs: 15 * 60e3, max: 10, message: { error: 'Too many attempts. Try again in 15 minutes.' } });
const reg = z.object({ name: z.string().min(2).max(60), email: z.string().email(), password: z.string().min(8).max(100) });

r.post('/register', limiter, async (q, s) => {
  const d = reg.parse(q.body); // role is never read from the client
  if (await User.findOne({ email: d.email.toLowerCase() })) return s.status(409).json({ error: 'Email already registered' });
  const u = await User.create({ ...d, password: await bcrypt.hash(d.password, 12), role: 'user' });
  setCookies(s, u); s.status(201).json({ user: pub(u) });
});
r.post('/login', limiter, async (q, s) => {
  const d = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(q.body);
  const u = await User.findOne({ email: d.email.toLowerCase() }).select('+password');
  if (!u || !(await bcrypt.compare(d.password, u.password))) return s.status(401).json({ error: 'Invalid email or password' });
  setCookies(s, u); s.json({ user: pub(u) });
});
r.post('/refresh', async (q, s) => {
  try {
    const p = jwt.verify(q.cookies.refresh, process.env.JWT_REFRESH_SECRET);
    const u = await User.findById(p.id);
    if (!u) throw new Error();
    setCookies(s, u); s.json({ user: pub(u) });
  } catch { s.status(401).json({ error: 'Session expired' }); }
});
r.get('/me', verifyToken, (q, s) => s.json({ user: pub(q.user) }));
r.post('/logout', (q, s) => s.clearCookie('access', ck()).clearCookie('refresh', ck()).json({ ok: 1 }));
export default r;
