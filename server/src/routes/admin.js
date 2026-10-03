import { Router } from 'express';
import multer from 'multer';
import { v2 as cloud } from 'cloudinary';
import { z } from 'zod';
import { verifyToken, requireAdmin } from '../middleware.js';
import { MenuItem, Order, Coupon, Holiday, Review, Settings } from '../models.js';

cloud.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const r = Router();
r.use(verifyToken, requireAdmin); // every /api/admin/* route is admin-only
const ist = (d = 0) => new Date(Date.now() + 19800000 + d * 864e5);

const crud = (p, M, zs) => {
  r.get(p, async (q, s) => s.json(await M.find().sort('-createdAt')));
  r.post(p, async (q, s) => s.status(201).json(await M.create(zs.parse(q.body))));
  r.put(`${p}/:id`, async (q, s) => s.json(await M.findByIdAndUpdate(q.params.id, zs.partial().parse(q.body), { new: true })));
  r.delete(`${p}/:id`, async (q, s) => { await M.findByIdAndDelete(q.params.id); s.json({ ok: 1 }); });
};
crud('/menu', MenuItem, z.object({ name: z.string().min(1), description: z.string().optional(), price: z.coerce.number().positive(),
  image: z.string().url().optional(), veg: z.boolean().optional(), tags: z.array(z.string()).optional(), nutrition: z.string().optional(),
  weekdays: z.array(z.number().int().min(0).max(6)).optional(), available: z.boolean().optional() }));
crud('/coupons', Coupon, z.object({ code: z.string().min(3).max(20), type: z.enum(['percent', 'flat']), value: z.coerce.number().positive(),
  expiry: z.coerce.date().optional(), active: z.boolean().optional() }));
crud('/holidays', Holiday, z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), reason: z.string().max(100).optional() }));
r.get('/reviews', async (q, s) => s.json(await Review.find().sort('-createdAt')));
r.put('/reviews/:id', async (q, s) => s.json(await Review.findByIdAndUpdate(q.params.id, { approved: z.boolean().parse(q.body.approved) }, { new: true })));
r.delete('/reviews/:id', async (q, s) => { await Review.findByIdAndDelete(q.params.id); s.json({ ok: 1 }); });

r.get('/stats', async (q, s) => {
  const start = new Date(ist().toISOString().slice(0, 10) + 'T00:00:00+05:30');
  const today = await Order.find({ createdAt: { $gte: start }, status: { $ne: 'cancelled' } });
  const date = ist(1).toISOString().slice(0, 10);
  s.json({ placedToday: today.length, revenueToday: today.reduce((a, o) => a + o.total, 0), tomorrowDate: date,
    tomorrowOrders: await Order.countDocuments({ deliveryDate: date, status: { $ne: 'cancelled' } }),
    pending: await Order.countDocuments({ status: 'pending' }) });
});
r.get('/orders', async (q, s) => s.json(await Order.find(q.query.date ? { deliveryDate: String(q.query.date) } : {}).sort('-createdAt').limit(200)));
r.patch('/orders/:id', async (q, s) => {
  const status = z.enum(['pending', 'confirmed', 'preparing', 'delivered', 'cancelled']).parse(q.body.status);
  s.json(await Order.findByIdAndUpdate(q.params.id, { status }, { new: true }));
});
r.get('/settings', async (q, s) => s.json((await Settings.findOne()) || (await Settings.create({}))));
r.put('/settings', async (q, s) => {
  const d = z.object({ businessName: z.string().min(2), whatsapp: z.string().regex(/^\d{10,15}$/, 'WhatsApp: digits only with country code, e.g. 919876543210'),
    upiId: z.string().max(60).optional(), cutoffHour: z.coerce.number().int().min(0).max(23), maxOrdersPerDay: z.coerce.number().int().min(1),
    deliveryWindow: z.string().min(3) }).parse(q.body);
  const cur = (await Settings.findOne()) || (await Settings.create({}));
  s.json(await Settings.findByIdAndUpdate(cur.id, d, { new: true }));
});
const up = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3e6 }, fileFilter: (q, f, cb) => cb(null, /^image\/(jpe?g|png|webp)$/.test(f.mimetype)) });
r.post('/upload', up.single('image'), (q, s) => {
  if (!q.file) return s.status(400).json({ error: 'Image required (jpg/png/webp, max 3MB)' });
  cloud.uploader.upload_stream({ folder: 'gnanams-kitchen' }, (e, res) =>
    e ? s.status(500).json({ error: 'Upload failed' }) : s.json({ url: res.secure_url })).end(q.file.buffer);
});
export default r;
