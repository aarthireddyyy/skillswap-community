import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Skill, SkillCategory, ProficiencyLevel } from '@/types';

interface SkillsState {
  mySkills: Skill[];
  setSkills: (skills: Skill[]) => void;
  addSkill: (skill: Omit<Skill, 'id'>) => Skill;
  editSkill: (id: string, updates: Partial<Skill>) => void;
  deleteSkill: (id: string) => void;
}

function generateId(): string {
  return 'skill_' + Math.random().toString(36).substring(2, 11);
}

export const useSkillsStore = create<SkillsState>()(
  persist(
    (set, get) => ({
      mySkills: [],

      setSkills: (skills: Skill[]) => {
        set({ mySkills: skills });
      },

      addSkill: (skillData: Omit<Skill, 'id'>) => {
        const newSkill: Skill = {
          ...skillData,
          id: generateId(),
        };
        set(state => ({ mySkills: [...state.mySkills, newSkill] }));
        return newSkill;
      },

      editSkill: (id: string, updates: Partial<Skill>) => {
        set(state => ({
          mySkills: state.mySkills.map(skill =>
            skill.id === id ? { ...skill, ...updates } : skill
          ),
        }));
      },

      deleteSkill: (id: string) => {
        set(state => ({
          mySkills: state.mySkills.filter(skill => skill.id !== id),
        }));
      },
    }),
    {
      name: 'skillhub-skills',
    }
  )
);
