import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({ baseURL: API_URL });

// Attach the JWT (if we have one) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cr_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
