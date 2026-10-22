import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const SKELETON_BLOCK_CLASS = "h-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800";

/** Preserves summary, filters, and card grid layout while pattern intelligence loads. */
export function PatternLibraryCatalogSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4" data-testid="pattern-library-catalog-skeleton" aria-busy="true">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={`pattern-library-summary-skeleton-${index}`}
            className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800"
          >
            <div className={cn(SKELETON_BLOCK_CLASS, "w-2/3")} />
            <div className={cn(SKELETON_BLOCK_CLASS, "mt-2 w-1/2")} />
          </div>
        ))}
      </div>
      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <div className={cn(SKELETON_BLOCK_CLASS, "w-40")} />
        <div className={cn(SKELETON_BLOCK_CLASS, "mt-3 w-full max-w-xl")} />
      </div>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status">
        Loading pattern intelligence…
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={`pattern-library-card-skeleton-${index}`}
            className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
          >
            <div className={cn(SKELETON_BLOCK_CLASS, "w-1/2")} />
            <div className={cn(SKELETON_BLOCK_CLASS, "mt-3 w-full")} />
            <div className={cn(SKELETON_BLOCK_CLASS, "mt-2 w-5/6")} />
          </div>
        ))}
      </div>
    </div>
  );
}
