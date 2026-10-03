import jwt from 'jsonwebtoken';
import { User } from './models.js';
export const verifyToken = async (q, s, n) => {
  try {
    const p = jwt.verify(q.cookies.access, process.env.JWT_SECRET);
    const u = await User.findById(p.id);
    if (!u || p.v !== u.tokenVersion) throw new Error();
    q.user = u; n();
  } catch { s.status(401).json({ error: 'Unauthorized' }); }
};
export const requireAdmin = (q, s, n) =>
  q.user?.role === 'admin' ? n() : s.status(403).json({ error: 'Admin only' });
