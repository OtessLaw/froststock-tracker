import axios from 'axios';

const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
const baseURL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

const API = axios.create({
  baseURL,
  timeout: 15000,
});

// Attach token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('froststock_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('froststock_token');
      localStorage.removeItem('froststock_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
