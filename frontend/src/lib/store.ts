import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: any | null;
  token: string | null;
  setUser: (user: any, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user, token) => {
        if (typeof window !== 'undefined') localStorage.setItem('token', token);
        set({ user, token });
      },
      logout: () => {
        if (typeof window !== 'undefined') localStorage.removeItem('token');
        set({ user: null, token: null });
      },
    }),
    {
      name: 'niche-crm-auth',
      // Only persist user + token
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
