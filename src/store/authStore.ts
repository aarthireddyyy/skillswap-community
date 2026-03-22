import { create } from 'zustand';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  initialize: () => Promise<void>;
  setSession: (authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null) => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  city: string;
  country: string;
}

async function fetchOrCreateProfile(authUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): Promise<User | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  if (profile) {
    return mapProfileToUser(profile, authUser.email, authUser.id);
  }

  const name =
    (authUser.user_metadata?.full_name as string) ||
    (authUser.user_metadata?.name as string) ||
    (authUser.email?.split('@')[0] ?? 'User');

  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({ id: authUser.id, name })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating profile:', insertError);
    return null;
  }

  return mapProfileToUser(newProfile, authUser.email, authUser.id);
}

async function mapProfileToUser(profile: Record<string, unknown>, email?: string, userId?: string): Promise<User> {
  // Fetch skills for this user
  let teachingSkills: any[] = [];
  let learningSkills: any[] = [];
  
  if (userId) {
    const { data: allSkills } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', userId);

    if (allSkills) {
      teachingSkills = allSkills
        .filter((s: any) => !s.type || s.type === 'teaching')
        .map((s: any) => ({
          id: s.id,
          name: s.skill_name,
          category: s.category,
          proficiency: s.proficiency,
          description: s.description || '',
          userId: s.user_id,
          type: 'teaching' as const,
        }));

      learningSkills = allSkills
        .filter((s: any) => s.type === 'learning')
        .map((s: any) => ({
          id: s.id,
          name: s.skill_name,
          category: s.category,
          proficiency: s.proficiency,
          description: s.description || '',
          userId: s.user_id,
          type: 'learning' as const,
        }));
    }
  }

  // Fetch completed swaps count
  let completedSwaps = 0;
  if (userId) {
    const { count } = await supabase
      .from('swaps')
      .select('*', { count: 'exact', head: true })
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'completed');
    
    completedSwaps = count || 0;
  }

  return {
    id: profile.id as string,
    name: (profile.name as string) || 'User',
    email: email || '',
    location: { 
      city: (profile.city as string) || '', 
      country: (profile.country as string) || '' 
    },
    rating: 5.0,
    reviewCount: 0,
    skillsTeaching: teachingSkills,
    skillsLearning: learningSkills,
    completedSwaps: completedSwaps,
    joinedAt: (profile.created_at as string) || new Date().toISOString(),
    isOnline: true,
  };
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;
    set({ isLoading: true });

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const user = await fetchOrCreateProfile(session.user);
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          initialized: true,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          initialized: true,
        });
      }
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        initialized: true,
      });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ isLoading: false });
      return { success: false, error: error.message };
    }

    if (data.user) {
      const user = await fetchOrCreateProfile(data.user);
      set({ user, isAuthenticated: !!user, isLoading: false });
      return {
        success: !!user,
        error: user ? undefined : 'Failed to load profile',
      };
    }

    set({ isLoading: false });
    return { success: false, error: 'Login failed' };
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true });

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.name,
          city: data.city,
          country: data.country,
        },
      },
    });

    if (error) {
      set({ isLoading: false });
      return { success: false, error: error.message };
    }

    if (authData.user) {
      await supabase
        .from('profiles')
        .upsert({ id: authData.user.id, name: data.name });

      const user = await fetchOrCreateProfile(authData.user);
      set({ user, isAuthenticated: !!user, isLoading: false });

      return {
        success: !!user,
        error: user ? undefined : 'Failed to create profile',
      };
    }

    set({ isLoading: false });
    return { success: false, error: 'Registration failed' };
  },

  // ✅ FINAL GOOGLE FIX
  loginWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (updates: Partial<User>) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...updates } });
    }
  },

  refreshUser: async () => {
    const { user } = get();
    if (!user) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const refreshedUser = await fetchOrCreateProfile(session.user);
      set({ user: refreshedUser });
    }
  },

  setSession: async (authUser) => {
    if (authUser) {
      const user = await fetchOrCreateProfile(authUser);
      set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        initialized: true,
      });
    } else {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        initialized: true,
      });
    }
  },
}));