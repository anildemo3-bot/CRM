import axios from 'axios';

const rawUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || 'https://crm-backends.onrender.com';
const api = axios.create({
  baseURL: rawUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token') ||
        (() => {
          try {
            const s = JSON.parse(localStorage.getItem('niche-crm-auth') || '{}');
            return s?.state?.token ?? null;
          } catch { return null; }
        })()
      : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('niche-crm-auth');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
