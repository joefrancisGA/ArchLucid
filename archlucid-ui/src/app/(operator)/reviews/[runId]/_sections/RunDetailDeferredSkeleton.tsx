/** Compact skeleton while mid-page deferred run-detail sections stream in. */
export function RunDetailMidDeferredSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4" role="status" aria-label="Loading review summary details">
      <div className="h-16 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
      <div className="h-24 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
    </div>
  );
}

/** Skeleton for pipeline, graph, and lower technical sections. */
export function RunDetailBelowFoldDeferredSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4" role="status" aria-label="Loading review technical sections">
      <div className="h-32 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
      <div className="h-48 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
      <div className="h-64 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
    </div>
  );
}
