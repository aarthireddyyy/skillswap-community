import { create } from 'zustand';
import { Skill, SkillCategory, ProficiencyLevel } from '@/types';
import { supabase } from '@/lib/supabase';

interface SkillsState {
  mySkills: Skill[];
  isLoading: boolean;
  fetchSkills: (userId: string) => Promise<void>;
  addSkill: (skill: Omit<Skill, 'id'>) => Promise<Skill | null>;
  editSkill: (id: string, updates: Partial<Skill>) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
}

/**
 * Map a Supabase row to the frontend Skill type.
 */
function mapRowToSkill(row: Record<string, unknown>): Skill {
  return {
    id: row.id as string,
    name: row.skill_name as string,
    category: row.category as SkillCategory,
    proficiency: row.proficiency as ProficiencyLevel,
    description: (row.description as string) || '',
    userId: row.user_id as string,
    type: (row.type as 'teaching' | 'learning') || 'teaching',
  };
}

export const useSkillsStore = create<SkillsState>()((set, get) => ({
  mySkills: [],
  isLoading: false,

  fetchSkills: async (userId: string) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching skills:', error);
      set({ isLoading: false });
      return;
    }

    set({ mySkills: (data || []).map(mapRowToSkill), isLoading: false });
  },

  addSkill: async (skillData: Omit<Skill, 'id'>) => {
    const { data, error } = await supabase
      .from('skills')
      .insert({
        user_id: skillData.userId,
        skill_name: skillData.name,
        category: skillData.category,
        proficiency: skillData.proficiency,
        description: skillData.description,
        type: skillData.type || 'teaching',
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding skill:', error);
      return null;
    }

    const newSkill = mapRowToSkill(data);
    set((state) => ({ mySkills: [...state.mySkills, newSkill] }));
    return newSkill;
  },

  editSkill: async (id: string, updates: Partial<Skill>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.skill_name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.proficiency !== undefined) dbUpdates.proficiency = updates.proficiency;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.type !== undefined) dbUpdates.type = updates.type;

    const { error } = await supabase
      .from('skills')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating skill:', error);
      return;
    }

    set((state) => ({
      mySkills: state.mySkills.map((skill) =>
        skill.id === id ? { ...skill, ...updates } : skill
      ),
    }));
  },

  deleteSkill: async (id: string) => {
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting skill:', error);
      return;
    }

    set((state) => ({
      mySkills: state.mySkills.filter((skill) => skill.id !== id),
    }));
  },
}));
