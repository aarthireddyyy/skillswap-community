import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Search, Inbox, Settings, ArrowRight, Bell, Star, MapPin, BookOpen, Users, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { StatCard } from '@/components/common/StatCard';
import { UserCard } from '@/components/common/UserCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { useAuthStore } from '@/store/authStore';
import { useSwapsStore } from '@/store/swapsStore';
import { useNotificationStore } from '@/store/notificationStore';
import { supabase } from '@/lib/supabase';
import { User, Notification } from '@/types';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthStore();
  const { getPendingCount, fetchSwaps, sendRequest } = useSwapsStore();
  const { notifications, fetchNotifications, markAsRead, unreadCount } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [recommendedMatches, setRecommendedMatches] = useState<User[]>([]);

  useEffect(() => {
    const load = async () => {
      if (user?.id) {
        // Refresh user data to get latest skills and stats
        await refreshUser();
        await fetchSwaps(user.id);
        await fetchNotifications(user.id);
        // Fetch a few other profiles as recommendations
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .limit(4);
        if (data) {
          setRecommendedMatches(
            data.map((p: Record<string, unknown>) => ({
              id: p.id as string,
              name: (p.name as string) || 'User',
              email: '',
              location: { city: '', country: '' },
              rating: 5.0,
              reviewCount: 0,
              skillsTeaching: [],
              skillsLearning: [],
              completedSwaps: 0,
              joinedAt: (p.created_at as string) || '',
              isOnline: false,
            }))
          );
        }
      }
      setIsLoading(false);
    };
    load();
  }, [user?.id, fetchSwaps, refreshUser, fetchNotifications]);

  const pendingCount = user ? getPendingCount(user.id) : 0;
  const notifCount = unreadCount();

  const handleRequestSwap = async (matchUser: User) => {
    if (!user) return;

    const requesterSkill = user.skillsTeaching?.[0]?.name || 'General Skill';
    const providerSkill = matchUser.skillsTeaching?.[0]?.name || 'General Skill';

    const result = await sendRequest({
      requesterId: user.id,
      providerId: matchUser.id,
      requesterSkill,
      providerSkill,
      matchType: 'one_way',
      message: `Hi ${matchUser.name}, I'd like to swap skills with you!`,
    });

    if (result) {
      navigate('/swaps');
    }
  };

  const handleNotificationClick = (notif: any) => {
    markAsRead(notif.id);
    navigate('/swaps');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const quickActions = [
    {
      title: 'Add New Skill',
      description: 'Share what you can teach',
      icon: Plus,
      gradient: 'from-blue-500 to-cyan-500',
      onClick: () => navigate('/skills'),
    },
    {
      title: 'View Swap Requests',
      description: pendingCount > 0 ? `${pendingCount} pending requests` : 'No pending requests',
      icon: Inbox,
      gradient: 'from-purple-500 to-pink-500',
      onClick: () => navigate('/swaps'),
      badge: pendingCount,
    },
    {
      title: 'Find Skills',
      description: 'Discover new things to learn',
      icon: Search,
      gradient: 'from-green-500 to-emerald-500',
      onClick: () => navigate('/search'),
    },
    {
      title: 'Edit Profile',
      description: 'Update your information',
      icon: Settings,
      gradient: 'from-slate-500 to-gray-600',
      onClick: () => navigate('/profile'),
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'swap_accepted':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'swap_request':
        return <Inbox className="h-4 w-4 text-primary" />;
      case 'new_match':
        return <Users className="h-4 w-4 text-primary" />;
      case 'new_review':
        return <Star className="h-4 w-4 text-warning" />;
      case 'swap_completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return '1d ago';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    return format(date, 'MMM d, yyyy');
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 pb-24 md:pb-6 animate-fade-in">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 md:h-20 md:w-20">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="gradient-bg text-primary-foreground text-xl font-bold">
                {user?.name ? getInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Welcome back, {user?.name?.split(' ')[0]}!
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{user?.location.city}, {user?.location.country}</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <span className="text-sm">
                  Member since {user?.joinedAt ? format(new Date(user.joinedAt), 'MMMM yyyy') : 'Recently'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Skills Teaching"
            value={user?.skillsTeaching.length || 0}
            icon={BookOpen}
            variant="primary"
          />
          <StatCard
            label="Skills Learning"
            value={user?.skillsLearning.length || 0}
            icon={BookOpen}
            variant="default"
          />
          <StatCard
            label="Completed Swaps"
            value={user?.completedSwaps || 0}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            label="Your Rating"
            value={`${user?.rating.toFixed(1) || '5.0'}★`}
            icon={Star}
            variant="warning"
          />
        </div>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map(action => (
              <Card
                key={action.title}
                className="card-hover cursor-pointer overflow-hidden"
                onClick={action.onClick}
              >
                <CardContent className="p-4 relative">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br',
                      action.gradient
                    )}
                  >
                    <action.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {action.description}
                  </p>
                  {action.badge !== undefined && action.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute top-3 right-3"
                    >
                      {action.badge}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recommended Matches */}
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recommended Matches</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/search">
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {recommendedMatches.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {recommendedMatches.map(matchUser => (
                  <UserCard
                    key={matchUser.id}
                    user={matchUser}
                    onViewProfile={u => navigate(`/profile/${u.id}`)}
                    onRequestSwap={handleRequestSwap}
                    compact
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <EmptyState
                    icon={Users}
                    title="No matches yet"
                    description="Add more skills to get matched with people who want to learn from you!"
                    actionLabel="Add Skill"
                    onAction={() => navigate('/skills')}
                  />
                </CardContent>
              </Card>
            )}
          </section>

          {/* Recent Notifications */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Notifications</h2>
              <Badge variant="secondary">{notifCount} new</Badge>
            </div>

            <Card>
              <CardContent className="p-0">
                {notifications.length > 0 ? (
                  <div className="divide-y">
                    {notifications.slice(0, 5).map(notif => (
                      <div
                        key={notif.id}
                        className={cn(
                          'flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer',
                          !notif.read && 'bg-primary/5'
                        )}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className="mt-0.5">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm',
                            !notif.read && 'font-medium'
                          )}>
                            {notif.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(notif.createdAt)}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8">
                    <EmptyState
                      icon={Bell}
                      title="No notifications"
                      description="You're all caught up!"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
