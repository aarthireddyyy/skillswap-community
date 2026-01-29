import { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MapPin } from 'lucide-react';

interface UserCardProps {
  user: User;
  showSwapButton?: boolean;
  compact?: boolean;
  onRequestSwap?: (user: User) => void;
  onViewProfile?: (user: User) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function UserCard({
  user,
  showSwapButton = true,
  compact = false,
  onRequestSwap,
  onViewProfile,
}: UserCardProps) {
  return (
    <Card className="card-hover group">
      <CardContent className={compact ? 'p-4' : 'p-5'}>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className={compact ? 'h-12 w-12' : 'h-14 w-14'}>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="gradient-bg text-primary-foreground text-sm font-medium">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            {user.isOnline && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-card" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground truncate">{user.name}</h4>
              <div className="flex items-center gap-1 text-warning">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="text-sm font-medium">{user.rating.toFixed(1)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-muted-foreground text-sm mt-0.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>
                {user.location.city}, {user.location.country}
              </span>
            </div>

            {/* Skills */}
            {!compact && user.skillsTeaching.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {user.skillsTeaching.slice(0, 3).map(skill => (
                  <Badge
                    key={skill.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {skill.name}
                  </Badge>
                ))}
                {user.skillsTeaching.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{user.skillsTeaching.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              {showSwapButton && (
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => onRequestSwap?.(user)}
                >
                  Request Swap
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewProfile?.(user)}
              >
                View Profile
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
