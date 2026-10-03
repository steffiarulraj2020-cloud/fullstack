import { Settings } from './models.js';

export const PLACEHOLDER_WHATSAPP = '919999999999';
export const bad = (m, status = 400) => Object.assign(new Error(m), { status });
export const ist = (d = 0) => new Date(Date.now() + 19800000 + d * 864e5); // IST wall-clock in UTC fields
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const getSettings = async () => {
  const st = (await Settings.findOne()) || (await Settings.create({}));
  if (st.whatsapp === PLACEHOLDER_WHATSAPP) st.whatsapp = '';
  return st;
};
