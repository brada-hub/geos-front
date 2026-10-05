import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('DOCUS_AUTH_TOKEN') || null,
    user: JSON.parse(localStorage.getItem('DOCUS_AUTH_USER') || 'null'),
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    currentUser: (state) => state.user,
    userName: (state) => state.user?.name || 'Usuario',
  },

  actions: {
    async login(email, password) {
      this.loading = true;
      this.error = null;

      try {
        const response = await api.post('/login', { email, password });
        const { token, user } = response.data;

        this.token = token;
        this.user = user;

        localStorage.setItem('DOCUS_AUTH_TOKEN', token);
        localStorage.setItem('DOCUS_AUTH_USER', JSON.stringify(user));

        return { success: true };
      } catch (err) {
        console.error('Error de login:', err);
        const msg = err.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
        this.error = msg;
        return { success: false, message: msg };
      } finally {
        this.loading = false;
      }
    },

    async checkAuth() {
      if (!this.token) return false;

      try {
        const response = await api.get('/me');
        this.user = response.data.user;
        localStorage.setItem('DOCUS_AUTH_USER', JSON.stringify(this.user));
        return true;
      } catch (err) {
        console.warn('Sesión no válida o expirada:', err);
        this.logout();
        return false;
      }
    },

    async logout() {
      try {
        if (this.token) {
          await api.post('/logout').catch(() => {});
        }
      } finally {
        this.token = null;
        this.user = null;
        this.error = null;
        localStorage.removeItem('DOCUS_AUTH_TOKEN');
        localStorage.removeItem('DOCUS_AUTH_USER');
      }
    },
  },
});
