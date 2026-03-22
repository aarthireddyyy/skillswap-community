import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Star, Calendar, CheckCircle, Mail, ArrowLeft, Sparkles, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { useSwapsStore } from '@/store/swapsStore';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const { sendRequest } = useSwapsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isMutualMatch, setIsMutualMatch] = useState(false);
  const [completedSwaps, setCompletedSwaps] = useState<any[]>([]);

  const isOwnProfile = !id || id === currentUser?.id;

  useEffect(() => {
    const load = async () => {
      console.log("=== PROFILE PAGE LOADING ===");
      console.log("Profile ID:", id);
      console.log("Current user:", currentUser);
      console.log("Is own profile:", isOwnProfile);

      if (isOwnProfile) {
        console.log("Loading own profile");
        if (currentUser?.id) {
          // Fetch ALL skills first (without type filter)
          const { data: allSkills } = await supabase
            .from('skills')
            .select('*')
            .eq('user_id', currentUser.id);

          console.log("Own skills fetched (all):", allSkills);

          // Separate by type (default to teaching if no type)
          const teachingSkills = (allSkills || []).filter((s: any) => 
            !s.type || s.type === 'teaching'
          );
          const learningSkills = (allSkills || []).filter((s: any) => 
            s.type === 'learning'
          );

          console.log("Teaching skills:", teachingSkills);
          console.log("Learning skills:", learningSkills);

          const mappedTeaching = teachingSkills.map((s: any) => ({
            id: s.id,
            name: s.skill_name,
            category: s.category,
            proficiency: s.proficiency,
            description: s.description || '',
            userId: s.user_id,
            type: 'teaching' as const,
          }));

          const mappedLearning = learningSkills.map((s: any) => ({
            id: s.id,
            name: s.skill_name,
            category: s.category,
            proficiency: s.proficiency,
            description: s.description || '',
            userId: s.user_id,
            type: 'learning' as const,
          }));

          console.log("Mapped teaching:", mappedTeaching);
          console.log("Mapped learning:", mappedLearning);

          setProfileUser({
            ...currentUser,
            skillsTeaching: mappedTeaching,
            skillsLearning: mappedLearning,
          });
        } else {
          setProfileUser(currentUser);
        }
      } else {
        console.log("Loading other user profile");
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
        console.log("Profile fetched:", profile);

        if (profile) {
          // Fetch ALL skills first (without type filter)
          const { data: allSkills } = await supabase
            .from('skills')
            .select('*')
            .eq('user_id', id);

          console.log("User skills fetched (all):", allSkills);

          // Separate by type (default to teaching if no type)
          const teachingSkills = (allSkills || []).filter((s: any) => 
            !s.type || s.type === 'teaching'
          );
          const learningSkills = (allSkills || []).filter((s: any) => 
            s.type === 'learning'
          );

          console.log("Teaching skills:", teachingSkills);
          console.log("Learning skills:", learningSkills);

          const mappedTeaching = teachingSkills.map((s: any) => ({
            id: s.id,
            name: s.skill_name,
            category: s.category,
            proficiency: s.proficiency,
            description: s.description || '',
            userId: s.user_id,
            type: 'teaching' as const,
          }));

          const mappedLearning = learningSkills.map((s: any) => ({
            id: s.id,
            name: s.skill_name,
            category: s.category,
            proficiency: s.proficiency,
            description: s.description || '',
            userId: s.user_id,
            type: 'learning' as const,
          }));

          console.log("Mapped teaching:", mappedTeaching);
          console.log("Mapped learning:", mappedLearning);

          setProfileUser({
            id: profile.id,
            name: profile.name || 'User',
            email: '',
            location: { city: '', country: '' },
            rating: 5,
            reviewCount: 0,
            skillsTeaching: mappedTeaching,
            skillsLearning: mappedLearning,
            completedSwaps: 0,
            joinedAt: profile.created_at,
            isOnline: false,
          });

          // Detect mutual match
          if (currentUser) {
            detectMutualMatch(currentUser, {
              skillsTeaching: mappedTeaching,
              skillsLearning: mappedLearning,
            });
          }
        } else {
          console.log("Profile not found");
        }
      }

      // Fetch completed swaps for this profile
      const profileId = isOwnProfile ? currentUser?.id : id;
      if (profileId) {
        const { data: swapsData } = await supabase
          .from('swaps')
          .select('*')
          .or(`requester_id.eq.${profileId},receiver_id.eq.${profileId}`)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(5);

        if (swapsData) {
          // Fetch names for the other users in swaps
          const otherUserIds = swapsData.map((s: any) => 
            s.requester_id === profileId ? s.receiver_id : s.requester_id
          );
          
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', otherUserIds);

          const profilesMap: Record<string, string> = {};
          profiles?.forEach((p: any) => {
            profilesMap[p.id] = p.name;
          });

          const enrichedSwaps = swapsData.map((s: any) => ({
            id: s.id,
            skill: s.skill_requested,
            partnerName: profilesMap[s.requester_id === profileId ? s.receiver_id : s.requester_id] || 'Unknown',
            completedAt: s.completed_at,
          }));

          setCompletedSwaps(enrichedSwaps);
        }
      }

      setIsLoading(false);
    };

    load();
  }, [id, currentUser, isOwnProfile]);

  const detectMutualMatch = (user: User, target: { skillsTeaching: any[], skillsLearning: any[] }) => {
    const userTeach = user.skillsTeaching?.map(s => s.name) || [];
    const userLearn = user.skillsLearning?.map(s => s.name) || [];
    const targetTeach = target.skillsTeaching?.map(s => s.name) || [];
    const targetLearn = target.skillsLearning?.map(s => s.name) || [];

    console.log("=== MUTUAL MATCH DETECTION ===");
    console.log("USER TEACH:", userTeach);
    console.log("USER LEARN:", userLearn);
    console.log("TARGET TEACH:", targetTeach);
    console.log("TARGET LEARN:", targetLearn);

    const match =
      userLearn.some(skill => targetTeach.includes(skill)) &&
      targetLearn.some(skill => userTeach.includes(skill));

    console.log("IS MUTUAL MATCH:", match);
    setIsMutualMatch(match);
  };

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleRequestSwap = async () => {
    console.log("BUTTON CLICKED");
    console.log("SWAP FUNCTION STARTED");
    console.log("currentUser:", currentUser);
    console.log("profileUser:", profileUser);

    if (!currentUser) {
      console.log("ERROR: No current user");
      toast({
        title: 'Error',
        description: 'Please login first',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (!profileUser) {
      console.log("ERROR: No profile user");
      toast({
        title: 'Error',
        description: 'User not found',
        variant: 'destructive',
      });
      return;
    }

    const requesterSkill = currentUser.skillsTeaching?.[0]?.name || 'General Skill';
    const providerSkill = profileUser.skillsTeaching?.[0]?.name || 'General Skill';

    console.log("SENDING DATA:", {
      requesterId: currentUser?.id,
      providerId: profileUser?.id,
      requesterSkill,
      providerSkill,
      matchType: isMutualMatch ? 'mutual' : 'one_way'
    });

    setIsSendingRequest(true);

    try {
      const result = await sendRequest({
        requesterId: currentUser.id,
        providerId: profileUser.id,
        requesterSkill: requesterSkill,
        providerSkill: providerSkill,
        matchType: isMutualMatch ? 'mutual' : 'one_way',
        message: `Hi ${profileUser.name}, I'd like to swap skills with you!${isMutualMatch ? ' This looks like a perfect match!' : ''}`,
      });

      console.log("SWAP REQUEST RESULT:", result);

      if (result) {
        console.log("SUCCESS: Swap created");
        toast({
          title: isMutualMatch ? '🎉 Perfect Match!' : 'Swap request sent!',
          description: isMutualMatch 
            ? `You both want to learn from each other! Request sent to ${profileUser.name}.`
            : `Your request has been sent to ${profileUser.name}.`,
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
      console.error('UNEXPECTED ERROR:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSendingRequest(false);
    }
  };

  if (isLoading) return <LoadingSkeleton variant="profile" />;

  if (!profileUser) return <EmptyState title="User not found" description="" />;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 pb-24 md:pb-6">

        {!isOwnProfile && (
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}

        <Card className="mb-6">
          <CardContent className="pt-6">

            <div className="flex items-center gap-4 flex-wrap">

              <Avatar className="h-20 w-20">
                <AvatarImage src={profileUser.avatar} />
                <AvatarFallback>
                  {getInitials(profileUser.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col flex-1">

                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-semibold">
                    {profileUser.name}
                  </h2>

                  {profileUser.isOnline && (
                    <Badge>
                      Online
                    </Badge>
                  )}

                  {!isOwnProfile && isMutualMatch && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Perfect Match
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profileUser.location.city || 'Unknown'}
                  </span>

                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {profileUser.joinedAt &&
                      `Joined ${format(new Date(profileUser.joinedAt), 'MMMM yyyy')}`}
                  </span>
                </div>

              </div>

              {!isOwnProfile && (
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </Button>

                  <Button 
                    onClick={() => {
                      console.log("BUTTON CLICKED");
                      handleRequestSwap();
                    }} 
                    disabled={isSendingRequest}
                    className={isMutualMatch ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" : ""}
                  >
                    {isSendingRequest ? 'Sending...' : isMutualMatch ? '✨ Request Swap' : 'Request Swap'}
                  </Button>
                </div>
              )}

            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Teaching" value={profileUser.skillsTeaching.length} icon={CheckCircle} variant="primary" />
          <StatCard label="Learning" value={profileUser.skillsLearning.length} icon={CheckCircle} variant="success" />
          <StatCard label="Rating" value={profileUser.rating} icon={Star} variant="warning" />
          <StatCard label="Swaps" value={profileUser.completedSwaps} icon={CheckCircle} variant="default" />
        </div>

        <Tabs defaultValue="teaching">
          <TabsList>
            <TabsTrigger value="teaching">
              Skills I Teach ({profileUser.skillsTeaching.length})
            </TabsTrigger>
            <TabsTrigger value="learning">
              Skills I Want to Learn ({profileUser.skillsLearning.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teaching">
            {profileUser.skillsTeaching && profileUser.skillsTeaching.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-4">
                {profileUser.skillsTeaching.map(skill => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    title="No teaching skills yet"
                    description={isOwnProfile ? "Add skills you can teach to start matching!" : "This user hasn't added teaching skills yet."}
                    actionLabel={isOwnProfile ? "Add Skill" : undefined}
                    onAction={isOwnProfile ? () => navigate('/skills') : undefined}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="learning">
            {profileUser.skillsLearning && profileUser.skillsLearning.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-4">
                {profileUser.skillsLearning.map(skill => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    title="No learning skills yet"
                    description={isOwnProfile ? "Add skills you want to learn to find matches!" : "This user hasn't added learning skills yet."}
                    actionLabel={isOwnProfile ? "Add Skill" : undefined}
                    onAction={isOwnProfile ? () => navigate('/skills') : undefined}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Completed Swaps Section */}
        {completedSwaps.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Recent Completed Swaps
            </h2>
            <div className="grid gap-3">
              {completedSwaps.map((swap) => (
                <Card key={swap.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <p className="font-medium">{swap.skill}</p>
                          <p className="text-sm text-muted-foreground">
                            Swapped with {swap.partnerName}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(swap.completedAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

      </main>

      <MobileNav />
    </div>
  );
}
