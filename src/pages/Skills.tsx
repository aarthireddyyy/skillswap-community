import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { SkillCard } from '@/components/common/SkillCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { useSkillsStore } from '@/store/skillsStore';
import { Skill, SkillCategory, ProficiencyLevel } from '@/types';

const categories: SkillCategory[] = ['Design', 'Code', 'Languages', 'Music', 'Cooking', 'Fitness', 'Arts', 'Business'];
const proficiencyLevels: ProficiencyLevel[] = ['Beginner', 'Intermediate', 'Expert'];

const skillSchema = z.object({
  name: z.string().min(2, 'Skill name must be at least 2 characters').max(50, 'Skill name must be less than 50 characters'),
  category: z.enum(['Design', 'Code', 'Languages', 'Music', 'Cooking', 'Fitness', 'Arts', 'Business']),
  proficiency: z.enum(['Beginner', 'Intermediate', 'Expert']),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must be less than 500 characters'),
});

type SkillForm = z.infer<typeof skillSchema>;

export default function Skills() {
  const { toast } = useToast();
  const { user, updateUser } = useAuthStore();
  const { mySkills, setSkills, addSkill, editSkill, deleteSkill } = useSkillsStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SkillForm>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: '',
      category: 'Design',
      proficiency: 'Intermediate',
      description: '',
    },
  });

  useEffect(() => {
    // Initialize skills from user's skillsTeaching
    if (user?.skillsTeaching && mySkills.length === 0) {
      setSkills(user.skillsTeaching);
    }
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [user, setSkills, mySkills.length]);

  const openAddDialog = () => {
    setEditingSkill(null);
    form.reset({
      name: '',
      category: 'Design',
      proficiency: 'Intermediate',
      description: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (skill: Skill) => {
    setEditingSkill(skill);
    form.reset({
      name: skill.name,
      category: skill.category,
      proficiency: skill.proficiency,
      description: skill.description,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (skill: Skill) => {
    deleteSkill(skill.id);
    if (user) {
      updateUser({
        skillsTeaching: user.skillsTeaching.filter(s => s.id !== skill.id),
      });
    }
    toast({
      title: 'Skill deleted',
      description: `"${skill.name}" has been removed from your skills.`,
    });
  };

  const onSubmit = async (data: SkillForm) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    if (editingSkill) {
      editSkill(editingSkill.id, data);
      if (user) {
        updateUser({
          skillsTeaching: user.skillsTeaching.map(s =>
            s.id === editingSkill.id ? { ...s, ...data } : s
          ),
        });
      }
      toast({
        title: 'Skill updated',
        description: `"${data.name}" has been updated.`,
      });
    } else {
      const newSkill = addSkill({
        name: data.name,
        category: data.category,
        proficiency: data.proficiency,
        description: data.description,
        userId: user?.id || '',
      });
      if (user) {
        updateUser({
          skillsTeaching: [...user.skillsTeaching, newSkill],
        });
      }
      toast({
        title: 'Skill added',
        description: `"${data.name}" has been added to your skills.`,
      });
    }

    setIsSubmitting(false);
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 pb-24 md:pb-6">
          <LoadingSkeleton variant="card" count={4} />
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Skills</h1>
            <p className="text-muted-foreground">
              Manage the skills you want to teach and share with others
            </p>
          </div>
          <Button variant="gradient" onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Skill
          </Button>
        </div>

        {/* Skills Grid */}
        {mySkills.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mySkills.map(skill => (
              <SkillCard
                key={skill.id}
                skill={skill}
                showActions
                onEdit={openEditDialog}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={Plus}
                title="No skills yet"
                description="Add skills you can teach to start matching with people who want to learn from you."
                actionLabel="Add Your First Skill"
                onAction={openAddDialog}
              />
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSkill ? 'Edit Skill' : 'Add New Skill'}</DialogTitle>
              <DialogDescription>
                {editingSkill
                  ? 'Update the details of your skill.'
                  : 'Share a skill you can teach to others.'}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skill Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Guitar, Python, Spanish" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="proficiency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proficiency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {proficiencyLevels.map(level => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe your experience and what you can teach..."
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="gradient" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingSkill ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      editingSkill ? 'Update Skill' : 'Add Skill'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </main>

      <MobileNav />
    </div>
  );
}
