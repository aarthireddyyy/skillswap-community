import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { mockUsers } from '@/lib/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  city: string;
  country: string;
}

function generateId(): string {
  return 'user_' + Math.random().toString(36).substring(2, 11);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        // Check mock users
        const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (existingUser) {
          set({ user: existingUser, isAuthenticated: true, isLoading: false });
          return { success: true };
        }

        // For demo, allow any email/password
        const newUser: User = {
          id: generateId(),
          name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          email,
          location: { city: 'New York', country: 'USA' },
          rating: 5.0,
          reviewCount: 0,
          skillsTeaching: [],
          skillsLearning: [],
          completedSwaps: 0,
          joinedAt: new Date().toISOString(),
          isOnline: true,
        };

        set({ user: newUser, isAuthenticated: true, isLoading: false });
        return { success: true };
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if email exists
        const exists = mockUsers.some(u => u.email.toLowerCase() === data.email.toLowerCase());
        if (exists) {
          set({ isLoading: false });
          return { success: false, error: 'Email already registered' };
        }

        const newUser: User = {
          id: generateId(),
          name: data.name,
          email: data.email,
          location: { city: data.city, country: data.country },
          rating: 5.0,
          reviewCount: 0,
          skillsTeaching: [],
          skillsLearning: [],
          completedSwaps: 0,
          joinedAt: new Date().toISOString(),
          isOnline: true,
        };

        set({ user: newUser, isAuthenticated: true, isLoading: false });
        return { success: true };
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (updates: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },
    }),
    {
      name: 'skillhub-auth',
    }
  )
);
