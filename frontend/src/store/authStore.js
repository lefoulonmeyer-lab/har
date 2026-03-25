import { create } from 'zustand';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  blockedStatus: null, // { type: 'banned' | 'suspended', reason: string }
  
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false, blockedStatus: null }),
  
  setBlocked: (type, reason) => set({ blockedStatus: { type, reason }, user: null, isAuthenticated: false, isLoading: false }),
  
  checkAuth: async () => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      set({ isLoading: false });
      return;
    }
    
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      set({ user: response.data, isAuthenticated: true, isLoading: false, blockedStatus: null });
    } catch (error) {
      // Check if user is blocked
      if (error.response?.status === 403) {
        const detail = error.response?.data?.detail || '';
        if (detail.startsWith('BANNED:')) {
          const reason = detail.replace('BANNED:', '');
          set({ blockedStatus: { type: 'banned', reason }, user: null, isAuthenticated: false, isLoading: false });
          return;
        }
        if (detail.startsWith('SUSPENDED:')) {
          const reason = detail.replace('SUSPENDED:', '');
          set({ blockedStatus: { type: 'suspended', reason }, user: null, isAuthenticated: false, isLoading: false });
          return;
        }
      }
      set({ user: null, isAuthenticated: false, isLoading: false, blockedStatus: null });
    }
  },
  
  exchangeSession: async (sessionId) => {
    try {
      const response = await axios.post(`${API}/auth/session`, 
        { session_id: sessionId },
        { withCredentials: true }
      );
      set({ user: response.data.user, isAuthenticated: true, isLoading: false, blockedStatus: null });
      return response.data.user;
    } catch (error) {
      // Check if user is blocked
      if (error.response?.status === 403) {
        const detail = error.response?.data?.detail || '';
        if (detail.startsWith('BANNED:')) {
          const reason = detail.replace('BANNED:', '');
          set({ blockedStatus: { type: 'banned', reason }, user: null, isAuthenticated: false, isLoading: false });
          throw error;
        }
        if (detail.startsWith('SUSPENDED:')) {
          const reason = detail.replace('SUSPENDED:', '');
          set({ blockedStatus: { type: 'suspended', reason }, user: null, isAuthenticated: false, isLoading: false });
          throw error;
        }
      }
      console.error('Session exchange failed:', error);
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
    set({ user: null, isAuthenticated: false, blockedStatus: null });
  },
  
  clearBlocked: () => set({ blockedStatus: null }),
  
  login: () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/forum';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  }
}));
