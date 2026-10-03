import axios from 'axios';
const api = axios.create({ baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api', withCredentials: true });
let refreshing = null;
api.interceptors.response.use((r) => r, async (e) => {
  const c = e.config;
  if (e.response?.status === 401 && !c._r && !c.url.startsWith('/auth/')) {
    c._r = true;
    refreshing = refreshing || api.post('/auth/refresh').finally(() => (refreshing = null));
    try { await refreshing; return api(c); } catch { /* fall through */ }
  }
  return Promise.reject(e);
});
export default api;
export const err = (e) => e.response?.data?.error || 'Something went wrong. Please try again.';
