import { defineBoot } from '#q-app/wrappers';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:8000/api',
});

// Interceptor de Peticiones: inyecta el token Bearer automáticamente si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('DOCUS_AUTH_TOKEN');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuestas: intercepta 401 Unauthorized para limpiar sesión y forzar login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/login');
      if (!isLoginRequest) {
        localStorage.removeItem('DOCUS_AUTH_TOKEN');
        localStorage.removeItem('DOCUS_AUTH_USER');
        if (!window.location.hash.includes('#/login')) {
          window.location.hash = '#/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
