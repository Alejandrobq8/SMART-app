export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-slate-200 rounded-md ${className}`}
      style={{ animation: "skeleton-pulse 1.4s ease-in-out infinite" }}
    />
  );
}

export function SkeletonCard() {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-2/3" />
    </section>
  );
}
