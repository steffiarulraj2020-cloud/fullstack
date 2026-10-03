import { createContext, createElement, useContext, useEffect, useState } from 'react';
import api from './api';

export const useGet = (u, d) => {
  const [v, setV] = useState(d);
  useEffect(() => { api.get(u).then((r) => setV(r.data)).catch(() => {}); }, [u]);
  return v;
};

const SettingsCtx = createContext({});
export const useSettings = () => useContext(SettingsCtx);
export function SettingsProvider({ children }) {
  const s = useGet('/settings', {});
  return createElement(SettingsCtx.Provider, { value: s }, children);
}

export function useTitle(t) {
  const { businessName = "Gnanam's Healthy Kitchen" } = useSettings();
  useEffect(() => { document.title = t ? `${t} · ${businessName}` : businessName; }, [t, businessName]);
}

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const servedOn = (m, day) => !m.weekdays?.length || m.weekdays.includes(day);
export const fmtHour = (h) => (h === undefined ? '' : `${((h + 11) % 12) + 1}:00 ${h < 12 ? 'AM' : 'PM'}`);
export const telHref = (p) => `tel:${String(p).replace(/[^\d+]/g, '')}`;
export const waHref = (n, text) => `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
