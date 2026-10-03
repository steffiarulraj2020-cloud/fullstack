import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const T = { timestamps: true };
export const User = model('User', new Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true, required: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  tokenVersion: { type: Number, default: 0 }, // bumped on logout to revoke issued tokens
}, T));
export const MenuItem = model('MenuItem', new Schema({
  name: { type: String, required: true }, description: String,
  price: { type: Number, required: true }, image: String,
  veg: { type: Boolean, default: true }, tags: [String], nutrition: String,
  weekdays: [Number], // 0=Sun..6=Sat; empty = every day
  available: { type: Boolean, default: true }, special: { type: Boolean, default: false },
}, T));
export const Order = model('Order', new Schema({
  name: String, phone: String, address: String,
  items: [{ item: Schema.Types.ObjectId, name: String, price: Number, qty: Number }],
  subtotal: Number, discount: { type: Number, default: 0 }, total: Number, coupon: String,
  deliveryDate: { type: String, index: true },
  payment: { type: String, enum: ['UPI', 'COD'] },
  status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'], default: 'pending' },
}, T));
export const Coupon = model('Coupon', new Schema({
  code: { type: String, unique: true, uppercase: true, required: true },
  type: { type: String, enum: ['percent', 'flat'], required: true },
  value: { type: Number, required: true }, expiry: Date, active: { type: Boolean, default: true },
  minOrder: { type: Number, default: 0 }, maxUses: { type: Number, default: null }, usedCount: { type: Number, default: 0 },
}, T));
export const Holiday = model('Holiday', new Schema({ date: { type: String, unique: true }, reason: String }, T));
export const Review = model('Review', new Schema({
  name: String, rating: { type: Number, min: 1, max: 5 }, comment: String, approved: { type: Boolean, default: false },
}, T));
export const Settings = model('Settings', new Schema({
  businessName: { type: String, default: "Gnanam's Healthy Kitchen" },
  whatsapp: { type: String, default: '' }, upiId: { type: String, default: '' },
  phone: { type: String, default: '' }, email: { type: String, default: '' }, address: { type: String, default: '' },
  hours: { type: String, default: '' }, deliveryArea: { type: String, default: 'Vailankanni' },
  mapsUrl: { type: String, default: '' }, instagramUrl: { type: String, default: '' }, facebookUrl: { type: String, default: '' },
  cutoffHour: { type: Number, default: 21, min: 0, max: 23 },
  maxOrdersPerDay: { type: Number, default: 30, min: 1 },
  deliveryWindow: { type: String, default: '8:30 AM – 10:00 AM' },
}, T));
