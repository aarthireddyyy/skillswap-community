import { cn } from '@/lib/utils';

type SkeletonVariant = 'card' | 'list' | 'profile' | 'text' | 'avatar';

interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  count?: number;
}

function SkeletonPulse({ className }: { className?: string }) {
  return <div className={cn('skeleton-shimmer rounded-lg', className)} />;
}

function CardSkeleton() {
  return (
    <div className="bg-card rounded-xl border p-4 space-y-3">
      <div className="flex items-start gap-3">
        <SkeletonPulse className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-5 w-3/4" />
          <div className="flex gap-2">
            <SkeletonPulse className="h-5 w-16" />
            <SkeletonPulse className="h-5 w-20" />
          </div>
        </div>
      </div>
      <SkeletonPulse className="h-4 w-full" />
      <SkeletonPulse className="h-4 w-2/3" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 border-b">
      <SkeletonPulse className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonPulse className="h-4 w-1/3" />
        <SkeletonPulse className="h-3 w-1/2" />
      </div>
      <SkeletonPulse className="h-9 w-24 rounded-lg" />
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <SkeletonPulse className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <SkeletonPulse className="h-6 w-48" />
          <SkeletonPulse className="h-4 w-32" />
          <SkeletonPulse className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-20" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function TextSkeleton() {
  return <SkeletonPulse className="h-4 w-full" />;
}

function AvatarSkeleton() {
  return <SkeletonPulse className="h-10 w-10 rounded-full" />;
}

export function LoadingSkeleton({ variant = 'card', className, count = 1 }: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return <CardSkeleton />;
      case 'list':
        return <ListSkeleton />;
      case 'profile':
        return <ProfileSkeleton />;
      case 'text':
        return <TextSkeleton />;
      case 'avatar':
        return <AvatarSkeleton />;
      default:
        return <CardSkeleton />;
    }
  };

  if (count === 1) {
    return <div className={className}>{renderSkeleton()}</div>;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </div>
  );
}
