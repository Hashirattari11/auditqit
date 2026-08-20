export function SkeletonCard() {
  return (
    <div className="p-5 rounded-xl bg-bg-surface border border-border-subtle animate-pulse">
      <div className="h-4 bg-border-subtle rounded w-1/3 mb-3" />
      <div className="h-8 bg-border-subtle rounded w-1/2 mb-2" />
      <div className="h-3 bg-border-subtle rounded w-full" />
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-bg-surface border border-border-subtle animate-pulse">
          <div className="w-2 h-2 rounded-full bg-border-subtle" />
          <div className="flex-1">
            <div className="h-3 bg-border-subtle rounded w-2/3 mb-1" />
            <div className="h-2 bg-border-subtle rounded w-1/3" />
          </div>
          <div className="h-3 bg-border-subtle rounded w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonReport() {
  return (
    <div className="max-w-6xl mx-auto px-4 pt-8 space-y-8">
      <div className="flex items-center gap-6">
        <div className="w-32 h-32 rounded-full bg-border-subtle animate-pulse" />
        <div className="space-y-3">
          <div className="h-4 bg-border-subtle rounded w-48" />
          <div className="h-3 bg-border-subtle rounded w-32" />
        </div>
      </div>
      <div className="h-40 rounded-2xl bg-bg-surface border border-border-subtle animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-bg-surface border border-border-subtle animate-pulse" />
        ))}
      </div>
    </div>
  );
}
