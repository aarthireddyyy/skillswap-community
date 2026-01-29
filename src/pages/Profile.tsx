import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Star, Calendar, CheckCircle, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { SkillCard } from '@/components/common/SkillCard';
import { StatCard } from '@/components/common/StatCard';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { mockUsers, mockReviews } from '@/lib/mockData';
import { User, Review } from '@/types';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  const isOwnProfile = !id || id === currentUser?.id;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOwnProfile) {
        setProfileUser(currentUser);
      } else {
        const foundUser = mockUsers.find(u => u.id === id);
        setProfileUser(foundUser || null);
      }
      
      // Get reviews for this user
      const userReviews = mockReviews.filter(
        r => r.revieweeId === (isOwnProfile ? currentUser?.id : id)
      );
      setReviews(userReviews);
      
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [id, currentUser, isOwnProfile]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRequestSwap = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    toast({
      title: 'Swap request sent!',
      description: `Your request has been sent to ${profileUser?.name}.`,
    });
  };

  const handleContact = () => {
    toast({
      title: 'Coming soon!',
      description: 'Direct messaging will be available soon.',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 pb-24 md:pb-6">
          <LoadingSkeleton variant="profile" />
        </main>
        <MobileNav />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 pb-24 md:pb-6">
          <EmptyState
            title="User not found"
            description="The user you're looking for doesn't exist or has been removed."
            actionLabel="Go Back"
            onAction={() => navigate(-1)}
          />
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 pb-24 md:pb-6 animate-fade-in">
        {/* Back Button */}
        {!isOwnProfile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}

        {/* Profile Header */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-24 gradient-bg" />
          <CardContent className="relative pt-0">
            <div className="flex flex-col md:flex-row gap-4 -mt-12">
              <Avatar className="h-24 w-24 border-4 border-card">
                <AvatarImage src={profileUser.avatar} />
                <AvatarFallback className="gradient-bg text-primary-foreground text-2xl font-bold">
                  {getInitials(profileUser.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 pt-2 md:pt-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold">{profileUser.name}</h1>
                      {profileUser.isOnline && (
                        <Badge variant="secondary" className="text-xs">
                          <span className="w-2 h-2 rounded-full bg-success mr-1" />
                          Online
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{profileUser.location.city}, {profileUser.location.country}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Joined {format(new Date(profileUser.joinedAt), 'MMMM yyyy')}</span>
                      </div>
                    </div>
                  </div>

                  {!isOwnProfile && (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleContact}>
                        <Mail className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                      <Button variant="gradient" onClick={handleRequestSwap}>
                        Request Swap
                      </Button>
                    </div>
                  )}
                </div>

                {profileUser.bio && (
                  <p className="text-muted-foreground mt-4">{profileUser.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Skills Teaching"
            value={profileUser.skillsTeaching.length}
            icon={CheckCircle}
            variant="primary"
          />
          <StatCard
            label="Completed Swaps"
            value={profileUser.completedSwaps}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            label="Rating"
            value={`${profileUser.rating.toFixed(1)}★`}
            icon={Star}
            variant="warning"
          />
          <StatCard
            label="Reviews"
            value={profileUser.reviewCount}
            icon={Star}
            variant="default"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="skills">
          <TabsList>
            <TabsTrigger value="skills">Skills ({profileUser.skillsTeaching.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="skills" className="mt-6">
            {profileUser.skillsTeaching.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profileUser.skillsTeaching.map(skill => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    title="No skills yet"
                    description={isOwnProfile ? "Add skills to start matching with people!" : "This user hasn't added any skills yet."}
                    actionLabel={isOwnProfile ? "Add Skill" : undefined}
                    onAction={isOwnProfile ? () => navigate('/skills') : undefined}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map(review => {
                  const reviewer = mockUsers.find(u => u.id === review.reviewerId);
                  return (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarImage src={reviewer?.avatar} />
                            <AvatarFallback className="gradient-bg text-primary-foreground text-xs">
                              {reviewer?.name ? getInitials(reviewer.name) : '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{reviewer?.name || 'Anonymous'}</h4>
                              <div className="flex items-center gap-1 text-warning">
                                {Array.from({ length: review.rating }).map((_, i) => (
                                  <Star key={i} className="h-4 w-4 fill-current" />
                                ))}
                              </div>
                            </div>
                            <p className="text-muted-foreground mt-2">{review.comment}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(review.createdAt), 'MMMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Star}
                    title="No reviews yet"
                    description={isOwnProfile ? "Complete swaps to receive reviews from other users." : "This user hasn't received any reviews yet."}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <MobileNav />
    </div>
  );
}
