import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const SKELETON_BLOCK_CLASS = "h-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800";

/** Preserves detail hero and section stack while pattern intelligence loads. */
export function PatternLibraryDetailSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4" data-testid="pattern-library-detail-skeleton" aria-busy="true">
      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <div className={cn(SKELETON_BLOCK_CLASS, "w-1/2")} />
        <div className={cn(SKELETON_BLOCK_CLASS, "mt-3 w-full max-w-2xl")} />
        <div className={cn(SKELETON_BLOCK_CLASS, "mt-2 w-5/6")} />
      </div>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status">
        Loading pattern intelligence…
      </p>
      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={`pattern-library-detail-section-skeleton-${index}`}
            className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
          >
            <div className={cn(SKELETON_BLOCK_CLASS, "w-40")} />
            <div className={cn(SKELETON_BLOCK_CLASS, "mt-3 w-full")} />
            <div className={cn(SKELETON_BLOCK_CLASS, "mt-2 w-4/5")} />
          </div>
        ))}
      </div>
    </div>
  );
}
