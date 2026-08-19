/** Compact skeleton while mid-page deferred run-detail sections stream in. */
export function RunDetailMidDeferredSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4" role="status" aria-label="Loading review summary details">
      <div className="h-16 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
      <div className="h-24 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
    </div>
  );
}

/** Skeleton while the findings &amp; assessment explanation section streams in. */
export function RunDetailExplanationSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-3" role="status" aria-label="Loading findings and assessment">
      <div className="h-10 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
      <div className="h-24 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
      <div className="h-16 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
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

/** Skeleton while package-changes-since-finalize streams on the review-package tab. */
export function RunDetailPackageChangesSinceFinalizeSkeleton(): React.JSX.Element {
  return (
    <div
      className="h-24 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
      role="status"
      aria-label="Loading package changes since finalize"
      data-testid="package-changes-since-finalize-loading"
    />
  );
}

/** Compact skeleton while pipeline timeline/stages stream (TB-2026 nested boundary). */
export function RunDetailBelowFoldPipelineSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-3" role="status" aria-label="Loading pipeline timeline">
      <div className="h-28 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
      <div className="h-20 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
    </div>
  );
}

/** Compact skeleton while graph temporal context streams (TB-2026 nested boundary). */
export function RunDetailBelowFoldProjectContextSkeleton(): React.JSX.Element {
  return (
    <div
      className="h-64 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
      role="status"
      aria-label="Loading architecture graph context"
    />
  );
}
