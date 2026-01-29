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
import { mockUsers } from '@/lib/mockData';
import { SkillCategory } from '@/types';

const categories: SkillCategory[] = ['Design', 'Code', 'Languages', 'Music', 'Cooking', 'Fitness', 'Arts', 'Business'];

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  const sortBy = searchParams.get('sort') || 'rating';

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
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
    let users = [...mockUsers];

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
  }, [query, category, sortBy]);

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
                onRequestSwap={u => navigate(`/swaps?request=${u.id}`)}
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
