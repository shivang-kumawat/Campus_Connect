export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-[linear-gradient(90deg,#eef3fa_0%,#dfeefb_50%,#eef3fa_100%)] bg-[length:800px_100%] animate-shimmer ${className}`}
      aria-hidden="true"
    />
  );
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-50/40 p-6">
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
