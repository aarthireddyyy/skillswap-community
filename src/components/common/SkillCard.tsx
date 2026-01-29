import { Skill, SkillCategory } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Trash2, Palette, Code, Globe, Music, ChefHat, Dumbbell, Brush, Briefcase } from 'lucide-react';

interface SkillCardProps {
  skill: Skill;
  showActions?: boolean;
  onEdit?: (skill: Skill) => void;
  onDelete?: (skill: Skill) => void;
}

const categoryIcons: Record<SkillCategory, React.ElementType> = {
  Design: Palette,
  Code: Code,
  Languages: Globe,
  Music: Music,
  Cooking: ChefHat,
  Fitness: Dumbbell,
  Arts: Brush,
  Business: Briefcase,
};

const categoryColors: Record<SkillCategory, string> = {
  Design: 'bg-category-design/10 text-category-design border-category-design/20',
  Code: 'bg-category-code/10 text-category-code border-category-code/20',
  Languages: 'bg-category-languages/10 text-category-languages border-category-languages/20',
  Music: 'bg-category-music/10 text-category-music border-category-music/20',
  Cooking: 'bg-category-cooking/10 text-category-cooking border-category-cooking/20',
  Fitness: 'bg-category-fitness/10 text-category-fitness border-category-fitness/20',
  Arts: 'bg-category-arts/10 text-category-arts border-category-arts/20',
  Business: 'bg-category-business/10 text-category-business border-category-business/20',
};

const proficiencyColors = {
  Beginner: 'bg-success/10 text-success border-success/20',
  Intermediate: 'bg-warning/10 text-warning border-warning/20',
  Expert: 'bg-primary/10 text-primary border-primary/20',
};

export function SkillCard({ skill, showActions = false, onEdit, onDelete }: SkillCardProps) {
  const Icon = categoryIcons[skill.category];

  return (
    <Card className="card-hover group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${categoryColors[skill.category]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground truncate">{skill.name}</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className={categoryColors[skill.category]}>
                  {skill.category}
                </Badge>
                <Badge variant="outline" className={proficiencyColors[skill.proficiency]}>
                  {skill.proficiency}
                </Badge>
              </div>
              {skill.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {skill.description}
                </p>
              )}
            </div>
          </div>

          {showActions && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit?.(skill)}
                aria-label="Edit skill"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete?.(skill)}
                aria-label="Delete skill"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
