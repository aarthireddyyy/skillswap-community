import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Check, X, Clock, MessageSquare, ArrowRight, Inbox, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { useSwapsStore } from '@/store/swapsStore';
import { supabase } from '@/lib/supabase';
import { Swap, User } from '@/types';
import { cn } from '@/lib/utils';

interface SwapWithUsers extends Swap {
  requester: User | undefined;
  provider: User | undefined;
}

export default function Swaps() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { swaps, fetchSwaps, acceptSwap, rejectSwap, completeSwap } = useSwapsStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('incoming');
  const [profilesMap, setProfilesMap] = useState<Record<string, User>>({});

  useEffect(() => {
    console.log("=== SWAPS PAGE LOADED ===");
    console.log("Current user:", user);
    
    if (!user?.id) {
      console.log("No user ID, skipping fetch");
      return;
    }
    
    const load = async () => {
      console.log("Calling fetchSwaps for user:", user.id);
      await fetchSwaps(user.id);
      
      // Fetch profiles for all users referenced in swaps
      const { swaps: currentSwaps } = useSwapsStore.getState();
      console.log("Swaps after fetch:", currentSwaps);
      
      const userIds = new Set<string>();
      currentSwaps.forEach((s) => {
        userIds.add(s.requesterId);
        userIds.add(s.providerId);
      });
      
      console.log("Fetching profiles for user IDs:", Array.from(userIds));
      
      if (userIds.size > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .in('id', Array.from(userIds));
        if (data) {
          const map: Record<string, User> = {};
          data.forEach((p: Record<string, unknown>) => {
            map[p.id as string] = {
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
            };
          });
          console.log("Profiles map:", map);
          setProfilesMap(map);
        }
      }
      setIsLoading(false);
    };
    load();
  }, [user?.id, fetchSwaps]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Enrich swaps with user data from profiles
  const enrichedSwaps = useMemo((): SwapWithUsers[] => {
    return swaps.map(swap => ({
      ...swap,
      requester: profilesMap[swap.requesterId],
      provider: profilesMap[swap.providerId],
    }));
  }, [swaps, profilesMap]);

  // Filter swaps by type
  console.log("=== FILTERING SWAPS ===");
  console.log("Current user ID:", user?.id);
  console.log("All enriched swaps:", enrichedSwaps);
  
  const incomingSwaps = enrichedSwaps.filter(
    swap => swap.providerId === user?.id && swap.status === 'pending'
  );
  console.log("Incoming swaps (receiver_id = current user):", incomingSwaps);
  console.log("Incoming count:", incomingSwaps.length);

  const outgoingSwaps = enrichedSwaps.filter(
    swap => swap.requesterId === user?.id && swap.status === 'pending'
  );
  console.log("Outgoing swaps (requester_id = current user):", outgoingSwaps);
  console.log("Outgoing count:", outgoingSwaps.length);

  const activeSwaps = enrichedSwaps.filter(
    swap =>
      (swap.requesterId === user?.id || swap.providerId === user?.id) &&
      swap.status === 'accepted'
  );

  const historySwaps = enrichedSwaps.filter(
    swap =>
      (swap.requesterId === user?.id || swap.providerId === user?.id) &&
      ['completed', 'rejected', 'cancelled'].includes(swap.status)
  );

  const handleAccept = async (swapId: string) => {
    await acceptSwap(swapId);
    toast({
      title: 'Swap accepted!',
      description: 'The requester has been notified. Time to start learning!',
    });
  };

  const handleReject = async (swapId: string) => {
    await rejectSwap(swapId);
    toast({
      title: 'Swap declined',
      description: 'The request has been declined.',
    });
  };

  const handleComplete = async (swapId: string) => {
    await completeSwap(swapId);
    toast({
      title: 'Swap completed!',
      description: 'Great job! Consider leaving a review.',
    });
  };

  const getStatusBadge = (status: Swap['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-success text-success-foreground"><Check className="h-3 w-3 mr-1" />Active</Badge>;
      case 'completed':
        return <Badge className="bg-primary text-primary-foreground"><Check className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Declined</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><X className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return null;
    }
  };

  const renderSwapCard = (swap: SwapWithUsers, type: 'incoming' | 'outgoing' | 'active' | 'history') => {
    const otherUser = type === 'incoming' ? swap.requester : swap.provider;
    const isIncoming = type === 'incoming';

    return (
      <Card key={swap.id} className="card-hover">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar className="h-12 w-12">
              <AvatarImage src={otherUser?.avatar} />
              <AvatarFallback className="gradient-bg text-primary-foreground text-sm">
                {otherUser?.name ? getInitials(otherUser.name) : '??'}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold truncate">{otherUser?.name || 'Unknown User'}</h4>
                <div className="flex items-center gap-2">
                  {swap.matchType === 'mutual' && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Perfect Match
                    </Badge>
                  )}
                  {getStatusBadge(swap.status)}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <span className="font-medium text-foreground">{swap.requesterSkill}</span>
                <ArrowRight className="h-4 w-4" />
                <span className="font-medium text-foreground">{swap.providerSkill}</span>
              </div>

              {swap.message && (
                <div className="flex items-start gap-2 mt-2 p-2 bg-muted rounded-lg">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground line-clamp-2">{swap.message}</p>
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(swap.createdAt), 'MMM d, yyyy')}
                </span>

                {/* Actions */}
                <div className="flex gap-2">
                  {type === 'incoming' && swap.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(swap.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        variant="gradient"
                        onClick={() => handleAccept(swap.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </>
                  )}
                  
                  {type === 'active' && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleComplete(swap.id)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Mark Complete
                    </Button>
                  )}

                  {otherUser && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/profile/${otherUser.id}`)}
                    >
                      View Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 pb-24 md:pb-6">
          <LoadingSkeleton variant="list" count={5} />
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
          <h1 className="text-3xl font-bold mb-2">Swaps</h1>
          <p className="text-muted-foreground">
            Manage your skill swap requests and active exchanges
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="incoming" className="relative">
              Incoming
              {incomingSwaps.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1 flex items-center justify-center text-xs">
                  {incomingSwaps.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing">
              Outgoing
              {outgoingSwaps.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] px-1 flex items-center justify-center text-xs">
                  {outgoingSwaps.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">
              Active
              {activeSwaps.length > 0 && (
                <Badge className="ml-2 h-5 min-w-[20px] px-1 flex items-center justify-center text-xs bg-success">
                  {activeSwaps.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="incoming">
            {incomingSwaps.length > 0 ? (
              <div className="space-y-4">
                {incomingSwaps.map(swap => renderSwapCard(swap, 'incoming'))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Inbox}
                    title="No incoming requests"
                    description="When someone wants to swap skills with you, their requests will appear here."
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="outgoing">
            {outgoingSwaps.length > 0 ? (
              <div className="space-y-4">
                {outgoingSwaps.map(swap => renderSwapCard(swap, 'outgoing'))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Inbox}
                    title="No outgoing requests"
                    description="Start by finding someone to swap skills with!"
                    actionLabel="Find Skills"
                    onAction={() => navigate('/search')}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="active">
            {activeSwaps.length > 0 ? (
              <div className="space-y-4">
                {activeSwaps.map(swap => renderSwapCard(swap, 'active'))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Inbox}
                    title="No active swaps"
                    description="Once a swap is accepted, it will appear here."
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            {historySwaps.length > 0 ? (
              <div className="space-y-4">
                {historySwaps.map(swap => renderSwapCard(swap, 'history'))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Inbox}
                    title="No swap history"
                    description="Completed, declined, and cancelled swaps will appear here."
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
