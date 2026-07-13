import axios from 'axios';

const api = axios.create({
  baseURL: '',  // Relative paths — Vite proxy forwards /auth and /trips to http://127.0.0.1:8000
});

// Interceptor to automatically attach JWT tokens to header requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
