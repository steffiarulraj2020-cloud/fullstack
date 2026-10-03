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
  const p = { id: u.id, v: u.tokenVersion };
  s.cookie('access', jwt.sign(p, process.env.JWT_SECRET, { expiresIn: '15m' }), ck(15 * 60e3));
  s.cookie('refresh', jwt.sign(p, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }), ck(7 * 864e5));
};
const pub = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });
const limiter = rateLimit({ windowMs: 15 * 60e3, max: 10, message: { error: 'Too many attempts. Try again in 15 minutes.' } });
// Accounts are created only by `npm run seed` (admin); there is no public registration.

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
    if (!u || p.v !== u.tokenVersion) throw new Error();
    setCookies(s, u); s.json({ user: pub(u) });
  } catch { s.status(401).json({ error: 'Session expired' }); }
});
r.get('/me', verifyToken, (q, s) => s.json({ user: pub(q.user) }));
r.post('/logout', async (q, s) => {
  const tok = [[q.cookies.refresh, process.env.JWT_REFRESH_SECRET], [q.cookies.access, process.env.JWT_SECRET]];
  for (const [t, key] of tok) {
    try {
      const p = jwt.verify(t, key);
      await User.updateOne({ _id: p.id, tokenVersion: p.v }, { $inc: { tokenVersion: 1 } });
      break;
    } catch { /* try next cookie */ }
  }
  s.clearCookie('access', ck()).clearCookie('refresh', ck()).json({ ok: 1 });
});
export default r;
