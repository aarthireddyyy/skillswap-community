import { User, Skill, Swap, Review, Notification, SkillCategory, ProficiencyLevel } from '@/types';

const categories: SkillCategory[] = ['Design', 'Code', 'Languages', 'Music', 'Cooking', 'Fitness', 'Arts', 'Business'];

const skillNames: Record<SkillCategory, string[]> = {
  Design: ['UI/UX Design', 'Graphic Design', 'Logo Design', 'Figma', 'Adobe Photoshop', 'Illustration', 'Web Design', 'Motion Graphics'],
  Code: ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Machine Learning', 'Mobile Development', 'SQL'],
  Languages: ['Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Italian', 'Portuguese', 'Korean'],
  Music: ['Guitar', 'Piano', 'Singing', 'Music Production', 'Drums', 'Violin', 'DJ', 'Songwriting'],
  Cooking: ['Italian Cuisine', 'Baking', 'Sushi Making', 'Vegan Cooking', 'BBQ', 'Pastry', 'Asian Cuisine', 'Meal Prep'],
  Fitness: ['Yoga', 'Weight Training', 'Running', 'Boxing', 'Swimming', 'Pilates', 'CrossFit', 'Nutrition'],
  Arts: ['Photography', 'Painting', 'Pottery', 'Knitting', 'Calligraphy', 'Sculpting', 'Drawing', 'Origami'],
  Business: ['Marketing', 'Public Speaking', 'Excel', 'Negotiation', 'Leadership', 'Entrepreneurship', 'SEO', 'Copywriting'],
};

const cities = [
  { city: 'New York', country: 'USA' },
  { city: 'London', country: 'UK' },
  { city: 'Berlin', country: 'Germany' },
  { city: 'Paris', country: 'France' },
  { city: 'Tokyo', country: 'Japan' },
  { city: 'Sydney', country: 'Australia' },
  { city: 'Toronto', country: 'Canada' },
  { city: 'Amsterdam', country: 'Netherlands' },
  { city: 'Barcelona', country: 'Spain' },
  { city: 'San Francisco', country: 'USA' },
];

const names = [
  'Sarah Chen', 'Marcus Johnson', 'Emma Williams', 'David Kim', 'Sofia Rodriguez',
  'James Wilson', 'Olivia Brown', 'Lucas Garcia', 'Ava Martinez', 'Noah Anderson',
  'Isabella Thomas', 'Ethan Jackson', 'Mia White', 'Alexander Harris', 'Charlotte Martin',
  'Benjamin Lee', 'Amelia Thompson', 'William Moore', 'Harper Davis', 'Mason Taylor',
  'Evelyn Clark', 'Liam Robinson', 'Abigail Walker', 'Michael Hall', 'Emily Young',
];

const proficiencyLevels: ProficiencyLevel[] = ['Beginner', 'Intermediate', 'Expert'];

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSkills(userId: string, count: number): Skill[] {
  const skills: Skill[] = [];
  const usedSkills = new Set<string>();

  while (skills.length < count) {
    const category = randomItem(categories);
    const skillName = randomItem(skillNames[category]);
    
    if (!usedSkills.has(skillName)) {
      usedSkills.add(skillName);
      skills.push({
        id: generateId(),
        name: skillName,
        category,
        proficiency: randomItem(proficiencyLevels),
        description: `I have been practicing ${skillName} for ${randomNumber(1, 10)} years and love sharing my knowledge with others.`,
        userId,
      });
    }
  }

  return skills;
}

function generateDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

// Generate mock users
export const mockUsers: User[] = names.map((name, index) => {
  const id = `user_${index + 1}`;
  const skillsTeaching = generateSkills(id, randomNumber(2, 5));
  
  return {
    id,
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
    location: randomItem(cities),
    bio: `Passionate about learning and sharing skills. ${randomItem([
      'Love meeting new people!',
      'Always eager to learn something new.',
      'Teaching is my passion.',
      'Excited to be part of this community.',
      'Looking forward to connecting with you!',
    ])}`,
    rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
    reviewCount: randomNumber(5, 50),
    skillsTeaching,
    skillsLearning: [randomItem(Object.values(skillNames).flat()), randomItem(Object.values(skillNames).flat())],
    completedSwaps: randomNumber(3, 30),
    joinedAt: generateDate(randomNumber(30, 365)),
    isOnline: Math.random() > 0.5,
    isAdmin: index === 0,
  };
});

// Generate mock swaps
export const mockSwaps: Swap[] = Array.from({ length: 15 }, (_, index) => {
  const requester = randomItem(mockUsers);
  let provider = randomItem(mockUsers);
  while (provider.id === requester.id) {
    provider = randomItem(mockUsers);
  }
  
  const statuses: Swap['status'][] = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
  const status = randomItem(statuses);
  
  return {
    id: `swap_${index + 1}`,
    requesterId: requester.id,
    providerId: provider.id,
    requesterSkill: requester.skillsTeaching[0]?.name || 'Guitar',
    providerSkill: provider.skillsTeaching[0]?.name || 'Piano',
    status,
    message: status === 'pending' ? `Hi! I'd love to swap skills with you. I can teach ${requester.skillsTeaching[0]?.name} in exchange for ${provider.skillsTeaching[0]?.name}.` : undefined,
    createdAt: generateDate(randomNumber(1, 30)),
    updatedAt: generateDate(randomNumber(0, 10)),
    scheduledDate: status === 'accepted' ? generateDate(-randomNumber(1, 14)) : undefined,
    completedAt: status === 'completed' ? generateDate(randomNumber(0, 7)) : undefined,
  };
});

// Generate mock reviews
export const mockReviews: Review[] = mockSwaps
  .filter(swap => swap.status === 'completed')
  .map((swap, index) => ({
    id: `review_${index + 1}`,
    swapId: swap.id,
    reviewerId: swap.requesterId,
    revieweeId: swap.providerId,
    rating: randomNumber(4, 5),
    comment: randomItem([
      'Amazing teacher! Very patient and knowledgeable.',
      'Great experience, learned so much in just one session.',
      'Highly recommend! Clear explanations and fun to learn with.',
      'Fantastic swap! Looking forward to our next session.',
      'Super helpful and friendly. 10/10 would swap again!',
    ]),
    createdAt: generateDate(randomNumber(0, 14)),
  }));

// Generate mock notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif_1',
    userId: 'user_1',
    type: 'swap_accepted',
    title: 'Swap Accepted!',
    message: 'Sarah accepted your swap request for Piano lessons.',
    read: false,
    createdAt: generateDate(0),
    relatedId: 'swap_1',
  },
  {
    id: 'notif_2',
    userId: 'user_1',
    type: 'new_match',
    title: 'New Match Found',
    message: 'John wants to learn Guitar - one of your teaching skills!',
    read: false,
    createdAt: generateDate(1),
  },
  {
    id: 'notif_3',
    userId: 'user_1',
    type: 'new_review',
    title: 'New 5-Star Review',
    message: 'You received a 5-star review from Emma!',
    read: true,
    createdAt: generateDate(3),
  },
  {
    id: 'notif_4',
    userId: 'user_1',
    type: 'swap_request',
    title: 'New Swap Request',
    message: 'Marcus wants to swap Spanish for your JavaScript skills.',
    read: true,
    createdAt: generateDate(5),
  },
  {
    id: 'notif_5',
    userId: 'user_1',
    type: 'swap_completed',
    title: 'Swap Completed',
    message: 'Your swap with Sofia has been marked as completed.',
    read: true,
    createdAt: generateDate(7),
  },
];

// Category stats for home page
export const categoryStats = categories.map(category => ({
  name: category,
  count: mockUsers.reduce((acc, user) => 
    acc + user.skillsTeaching.filter(skill => skill.category === category).length, 0
  ),
}));

// Platform stats
export const platformStats = {
  activeMembers: mockUsers.length * 20,
  skillsShared: mockUsers.reduce((acc, user) => acc + user.skillsTeaching.length, 0) * 15,
  averageRating: 4.8,
  completedSwaps: mockSwaps.filter(s => s.status === 'completed').length * 25,
};
