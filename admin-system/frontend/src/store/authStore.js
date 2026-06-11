import create from 'zustand';
import { authAPI } from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isLoading: false,
  error: null,

  // ═════════════════════════════
  // REGISTER
  // ═════════════════════════════
  register: async (firstName, lastName, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register({
        firstName,
        lastName,
        email,
        password,
      });
      const { user, accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      set({
        user,
        accessToken,
        refreshToken,
        isLoading: false,
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // ═════════════════════════════
  // LOGIN
  // ═════════════════════════════
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });
      const { user, accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      set({
        user,
        accessToken,
        refreshToken,
        isLoading: false,
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // ═════════════════════════════
  // LOGOUT
  // ═════════════════════════════
  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
      });
    }
  },

  // ═════════════════════════════
  // CHANGE PASSWORD
  // ═════════════════════════════
  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // ═════════════════════════════
  // FORGOT PASSWORD
  // ═════════════════════════════
  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.forgotPassword({ email });
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Request failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // ═════════════════════════════
  // SET USER (for profile updates)
  // ═════════════════════════════
  setUser: (user) => set({ user }),

  // ═════════════════════════════
  // CLEAR ERROR
  // ═════════════════════════════
  clearError: () => set({ error: null }),

  // ═════════════════════════════
  // RESTORE SESSION
  // ═════════════════════════════
  restoreSession: () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (accessToken) {
      set({ accessToken, refreshToken });
    }
  },
}));
