interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer rounded-card ${className}`}
    />
  );
}

export function OutfitSkeleton() {
  return (
    <div className="card space-y-4">
      <Skeleton className="h-5 w-48" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="aspect-square" />
        <Skeleton className="aspect-square" />
        <Skeleton className="aspect-square" />
        <Skeleton className="aspect-square" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

export function WardrobeGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-card" />
      ))}
    </div>
  );
}
