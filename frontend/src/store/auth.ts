import { create } from 'zustand';
import { api } from '@/lib/api';
import type { AuthResponse, User } from '@/lib/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name?: string) => Promise<User>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  hydrate: async () => {
    const token = localStorage.getItem('diyanara_token');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const user = await api<User>('/auth/me');
      set({ user, loading: false });
    } catch {
      localStorage.removeItem('diyanara_token');
      set({ user: null, loading: false });
    }
  },
  login: async (email, password) => {
    const res = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('diyanara_token', res.token);
    set({ user: res.user });
    return res.user;
  },
  register: async (email, password, name) => {
    const res = await api<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    localStorage.setItem('diyanara_token', res.token);
    set({ user: res.user });
    return res.user;
  },
  logout: () => {
    localStorage.removeItem('diyanara_token');
    set({ user: null });
  },
}));
