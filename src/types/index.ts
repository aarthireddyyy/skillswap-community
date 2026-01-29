export type SkillCategory = 
  | 'Design' 
  | 'Code' 
  | 'Languages' 
  | 'Music' 
  | 'Cooking' 
  | 'Fitness' 
  | 'Arts' 
  | 'Business';

export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Expert';

export type SwapStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  location: {
    city: string;
    country: string;
  };
  bio?: string;
  rating: number;
  reviewCount: number;
  skillsTeaching: Skill[];
  skillsLearning: string[];
  completedSwaps: number;
  joinedAt: string;
  isOnline?: boolean;
  isAdmin?: boolean;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  proficiency: ProficiencyLevel;
  description: string;
  userId: string;
}

export interface Swap {
  id: string;
  requesterId: string;
  providerId: string;
  requesterSkill: string;
  providerSkill: string;
  status: SwapStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string;
  completedAt?: string;
}

export interface Review {
  id: string;
  swapId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'swap_request' | 'swap_accepted' | 'swap_rejected' | 'swap_completed' | 'new_review' | 'new_match';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
}
