import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { MenuItem, Order, Coupon, Holiday, Review, Settings } from '../models.js';

const r = Router();
const bad = (m) => Object.assign(new Error(m), { status: 400 });
const ist = (d = 0) => new Date(Date.now() + 19800000 + d * 864e5); // IST wall-clock in UTC fields
const getSettings = async () => (await Settings.findOne()) || (await Settings.create({}));
const calc = (c, sub) => (!c ? 0 : Math.min(sub, Math.round(c.type === 'percent' ? (sub * c.value) / 100 : c.value)));
const findCoupon = async (code) => {
  if (!code) return null;
  const c = await Coupon.findOne({ code: code.toUpperCase(), active: true });
  if (!c || (c.expiry && c.expiry < new Date())) throw bad('Invalid or expired coupon');
  return c;
};

r.get('/menu', async (q, s) => s.json(await MenuItem.find({ available: true }).sort('name')));
r.get('/settings', async (q, s) => s.json(await getSettings()));
r.get('/reviews', async (q, s) => s.json(await Review.find({ approved: true }).sort('-createdAt').limit(50)));
r.post('/reviews', rateLimit({ windowMs: 36e5, max: 5 }), async (q, s) => {
  const d = z.object({ name: z.string().min(2).max(60), rating: z.number().int().min(1).max(5), comment: z.string().min(3).max(500) }).parse(q.body);
  await Review.create({ ...d, approved: false });
  s.status(201).json({ ok: 1 });
});
r.get('/booking-status', async (q, s) => {
  const st = await getSettings();
  const date = ist(1).toISOString().slice(0, 10);
  const hol = await Holiday.findOne({ date });
  const n = await Order.countDocuments({ deliveryDate: date, status: { $ne: 'cancelled' } });
  s.json({ date, open: ist().getUTCHours() < st.cutoffHour, holiday: hol ? hol.reason || 'Holiday' : null,
    remaining: Math.max(0, st.maxOrdersPerDay - n), cutoffHour: st.cutoffHour });
});
r.post('/coupons/validate', async (q, s) => {
  const d = z.object({ code: z.string().max(20), subtotal: z.number().min(0) }).parse(q.body);
  const c = await findCoupon(d.code);
  if (!c) throw bad('Enter a coupon code');
  s.json({ code: c.code, discount: calc(c, d.subtotal) });
});
const ord = z.object({
  name: z.string().min(2).max(60),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  address: z.string().min(8, 'Enter your full address').max(300),
  items: z.array(z.object({ id: z.string().regex(/^[a-f\d]{24}$/), qty: z.number().int().min(1).max(20) })).min(1).max(15),
  coupon: z.string().max(20).optional(), payment: z.enum(['UPI', 'COD']), deliveryDate: z.string(),
});
r.post('/orders', rateLimit({ windowMs: 36e5, max: 20 }), async (q, s) => {
  const d = ord.parse(q.body);
  const st = await getSettings();
  const date = ist(1).toISOString().slice(0, 10);
  if (d.deliveryDate !== date) throw bad('We deliver only the next day');
  if (ist().getUTCHours() >= st.cutoffHour) throw bad(`Orders closed for today (cutoff ${st.cutoffHour}:00)`);
  if (await Holiday.findOne({ date })) throw bad('We are closed on the delivery date');
  const n = await Order.countDocuments({ deliveryDate: date, status: { $ne: 'cancelled' } });
  if (n >= st.maxOrdersPerDay) throw bad('Fully booked for tomorrow');
  const docs = await MenuItem.find({ _id: { $in: d.items.map((i) => i.id) }, available: true });
  const items = d.items.map((i) => {
    const m = docs.find((x) => x.id === i.id);
    if (!m) throw bad('An item is no longer available');
    return { item: m._id, name: m.name, price: m.price, qty: i.qty };
  });
  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
  const c = await findCoupon(d.coupon);
  const discount = calc(c, subtotal);
  const o = await Order.create({ name: d.name, phone: d.phone, address: d.address, payment: d.payment,
    deliveryDate: date, items, subtotal, discount, total: subtotal - discount, coupon: c?.code });
  const text = [`*New order – ${st.businessName}*`, `Order #${o.id.slice(-6)}`, `Name: ${o.name}`, `Phone: ${o.phone}`,
    `Address: ${o.address}`, ...items.map((i) => `• ${i.name} x${i.qty} = ₹${i.price * i.qty}`),
    discount ? `Coupon ${c.code}: -₹${discount}` : null, `*Total: ₹${o.total}* (delivery included)`,
    `Payment: ${o.payment}`, `Delivery: ${date}, ${st.deliveryWindow}`].filter(Boolean).join('\n');
  s.status(201).json({ order: o, waUrl: `https://wa.me/${st.whatsapp}?text=${encodeURIComponent(text)}` });
});
export default r;
