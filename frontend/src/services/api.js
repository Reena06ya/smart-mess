import axios from 'axios';

// Smart normalizer for API Base URL on Render, Vercel, or Local
const getApiBaseUrl = () => {
  let url = import.meta.env.VITE_API_BASE_URL || '/api';
  if (!url || typeof url !== 'string' || url.trim() === '') return '/api';
  url = url.trim();
  if (url.startsWith('/')) return url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  // Strip trailing slashes
  url = url.replace(/\/+$/, '');
  // Append /api if not already present
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smart_mess_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for session expiry handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, clean up expired session if not already on login
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('smart_mess_token');
        localStorage.removeItem('smart_mess_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
