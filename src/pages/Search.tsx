import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, Grid, List, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { SearchBar } from '@/components/common/SearchBar';
import { UserCard } from '@/components/common/UserCard';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { useSwapsStore } from '@/store/swapsStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { User, Skill, SkillCategory } from '@/types';

const categories: SkillCategory[] = ['Design', 'Code', 'Languages', 'Music', 'Cooking', 'Fitness', 'Arts', 'Business'];

export default function SearchPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const { sendRequest } = useSwapsStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  const sortBy = searchParams.get('sort') || 'rating';

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      // Fetch profiles
      const { data: profiles } = await supabase.from('profiles').select('*');
      // Fetch skills
      const { data: skills } = await supabase.from('skills').select('*');

      if (profiles) {
        const teachingSkillsByUser: Record<string, any[]> = {};
        const learningSkillsByUser: Record<string, any[]> = {};
        
        (skills || []).forEach((s: Record<string, unknown>) => {
          const uid = s.user_id as string;
          const skillType = (s.type as string) || 'teaching'; // Default to teaching if no type
          
          const mappedSkill = {
            id: s.id as string,
            name: s.skill_name as string,
            category: s.category as SkillCategory,
            proficiency: s.proficiency as Skill['proficiency'],
            description: (s.description as string) || '',
            userId: uid,
            type: skillType as 'teaching' | 'learning',
          };

          if (skillType === 'teaching') {
            if (!teachingSkillsByUser[uid]) teachingSkillsByUser[uid] = [];
            teachingSkillsByUser[uid].push(mappedSkill);
          } else if (skillType === 'learning') {
            if (!learningSkillsByUser[uid]) learningSkillsByUser[uid] = [];
            learningSkillsByUser[uid].push(mappedSkill);
          }
        });

        console.log("SEARCH: Teaching skills by user:", teachingSkillsByUser);
        console.log("SEARCH: Learning skills by user:", learningSkillsByUser);

        const users: User[] = profiles.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          name: (p.name as string) || 'User',
          email: '',
          location: { city: '', country: '' },
          rating: 5.0,
          reviewCount: 0,
          skillsTeaching: teachingSkillsByUser[p.id as string] || [],
          skillsLearning: learningSkillsByUser[p.id as string] || [],
          completedSwaps: 0,
          joinedAt: (p.created_at as string) || '',
          isOnline: false,
        }));
        
        console.log("SEARCH: Total users loaded:", users.length);
        console.log("SEARCH: Users with teaching skills:", users.filter(u => u.skillsTeaching.length > 0).length);
        
        setAllUsers(users);
      }
      setIsLoading(false);
    };
    fetchUsers();
  }, []);

  const handleSearch = (newQuery: string) => {
    setSearchParams(prev => {
      prev.set('q', newQuery);
      return prev;
    });
  };

  const handleCategoryChange = (newCategory: string) => {
    setSearchParams(prev => {
      if (newCategory === 'all') {
        prev.delete('category');
      } else {
        prev.set('category', newCategory);
      }
      return prev;
    });
  };

  const handleSortChange = (newSort: string) => {
    setSearchParams(prev => {
      prev.set('sort', newSort);
      return prev;
    });
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const filteredUsers = useMemo(() => {
    let users = [...allUsers];

    // Filter out current user (don't show your own profile in search)
    if (currentUser?.id) {
      users = users.filter(user => user.id !== currentUser.id);
    }

    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      users = users.filter(user =>
        user.name.toLowerCase().includes(lowerQuery) ||
        user.skillsTeaching.some(skill =>
          skill.name.toLowerCase().includes(lowerQuery) ||
          skill.category.toLowerCase().includes(lowerQuery)
        )
      );
    }

    // Filter by category
    if (category && category !== 'all') {
      users = users.filter(user =>
        user.skillsTeaching.some(skill => skill.category === category)
      );
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        users.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        users.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'swaps':
        users.sort((a, b) => b.completedSwaps - a.completedSwaps);
        break;
      case 'newest':
        users.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
        break;
    }

    return users;
  }, [query, category, sortBy, allUsers, currentUser?.id]);

  const handleRequestSwap = async (targetUser: User) => {
    console.log("=== SEARCH PAGE: REQUEST SWAP CLICKED ===");
    console.log("Current user:", currentUser);
    console.log("Target user:", targetUser);
    console.log("Current user ID:", currentUser?.id);
    console.log("Target user ID:", targetUser?.id);

    if (!currentUser) {
      console.log("ERROR: No current user");
      toast({
        title: 'Please login',
        description: 'You need to be logged in to send swap requests',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (!targetUser) {
      console.log("ERROR: No target user");
      return;
    }

    // Detect mutual match
    const userTeach = currentUser.skillsTeaching?.map(s => s.name) || [];
    const userLearn = currentUser.skillsLearning?.map(s => s.name) || [];
    const targetTeach = targetUser.skillsTeaching?.map(s => s.name) || [];
    const targetLearn = targetUser.skillsLearning?.map(s => s.name) || [];

    console.log("USER TEACH:", userTeach);
    console.log("USER LEARN:", userLearn);
    console.log("TARGET TEACH:", targetTeach);
    console.log("TARGET LEARN:", targetLearn);

    const isMutualMatch =
      userLearn.some(skill => targetTeach.includes(skill)) &&
      targetLearn.some(skill => userTeach.includes(skill));

    console.log("IS MUTUAL MATCH:", isMutualMatch);
    console.log("MATCH TYPE:", isMutualMatch ? 'mutual' : 'one_way');

    const requesterSkill = currentUser.skillsTeaching?.[0]?.name || 'General Skill';
    const providerSkill = targetUser.skillsTeaching?.[0]?.name || 'General Skill';

    console.log("Requester skill:", requesterSkill);
    console.log("Provider skill:", providerSkill);

    const swapData = {
      requesterId: currentUser.id,
      providerId: targetUser.id,
      requesterSkill: requesterSkill,
      providerSkill: providerSkill,
      matchType: isMutualMatch ? 'mutual' as const : 'one_way' as const,
      message: `Hi ${targetUser.name}, I'd like to swap skills with you!${isMutualMatch ? ' This looks like a perfect match!' : ''}`,
    };

    console.log("=== ABOUT TO SEND REQUEST ===");
    console.log("Swap data:", swapData);

    try {
      const result = await sendRequest(swapData);

      console.log("=== REQUEST COMPLETED ===");
      console.log("Result:", result);

      if (result) {
        console.log("SUCCESS: Swap created with ID:", result.id);
        toast({
          title: isMutualMatch ? '🎉 Perfect Match!' : 'Swap request sent!',
          description: isMutualMatch 
            ? `You both want to learn from each other! Request sent to ${targetUser.name}.`
            : `Your request has been sent to ${targetUser.name}.`,
        });
        navigate('/swaps');
      } else {
        console.log("ERROR: sendRequest returned null");
        toast({
          title: 'Failed to send request',
          description: 'Check console for errors',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('=== UNEXPECTED ERROR ===');
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const hasFilters = query || (category && category !== 'all');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 pb-24 md:pb-6">
          <LoadingSkeleton variant="card" count={6} />
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 pb-24 md:pb-6 animate-fade-in">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Find Skills</h1>
          <p className="text-muted-foreground">
            Discover people who can teach you something new
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            placeholder="Search skills or people..."
            onSearch={handleSearch}
            size="lg"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Category Pills */}
          <div className="flex-1">
            <Tabs value={category} onValueChange={handleCategoryChange}>
              <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
                <TabsTrigger
                  value="all"
                  className="rounded-full data-[state=active]:gradient-bg data-[state=active]:text-primary-foreground"
                >
                  All
                </TabsTrigger>
                {categories.map(cat => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="rounded-full data-[state=active]:gradient-bg data-[state=active]:text-primary-foreground"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Sort & View */}
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
                <SelectItem value="swaps">Most Swaps</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {hasFilters && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {query && (
              <Badge variant="secondary" className="gap-1">
                Search: {query}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSearchParams(prev => {
                    prev.delete('q');
                    return prev;
                  })}
                />
              </Badge>
            )}
            {category && category !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {category}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleCategoryChange('all')}
                />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}

        {/* Results */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'result' : 'results'} found
          </p>
        </div>

        {filteredUsers.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'flex flex-col gap-4'
          }>
            {filteredUsers.map(user => (
              <UserCard
                key={user.id}
                user={user}
                compact={viewMode === 'list'}
                onViewProfile={u => navigate(`/profile/${u.id}`)}
                onRequestSwap={handleRequestSwap}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={Filter}
                title="No results found"
                description="Try adjusting your search or filters to find what you're looking for."
                actionLabel="Clear Filters"
                onAction={clearFilters}
              />
            </CardContent>
          </Card>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
