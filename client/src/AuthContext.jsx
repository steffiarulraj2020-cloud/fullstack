import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';
const C = createContext();
export const useAuth = () => useContext(C);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try { setUser((await api.get('/auth/me')).data.user); }
      catch { try { setUser((await api.post('/auth/refresh')).data.user); } catch { setUser(null); } }
      setLoading(false);
    })();
  }, []);
  const login = async (email, password) => { const u = (await api.post('/auth/login', { email, password })).data.user; setUser(u); return u; };
  const register = async (name, email, password) => { const u = (await api.post('/auth/register', { name, email, password })).data.user; setUser(u); return u; };
  const logout = async () => { await api.post('/auth/logout').catch(() => {}); setUser(null); };
  return <C.Provider value={{ user, loading, login, register, logout }}>{children}</C.Provider>;
}
