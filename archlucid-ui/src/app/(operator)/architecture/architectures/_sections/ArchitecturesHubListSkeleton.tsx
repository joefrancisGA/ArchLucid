import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ARCHITECTURES_HUB_LIST_SKELETON_STATUS } from "@/lib/architectures-hub-copy";

const SKELETON_BLOCK_CLASS = "h-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800";

/** Preserves toolbar + table layout while the draft registry hydrates. */
export function ArchitecturesHubListSkeleton(): React.JSX.Element {
  return (
    <div className="mt-4 space-y-4" data-testid="architecture-draft-list-skeleton" aria-busy="true">
      <div className={cn(SKELETON_BLOCK_CLASS, "w-full max-w-xs")} />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={`architecture-draft-filter-skeleton-${index}`} className={cn(SKELETON_BLOCK_CLASS, "h-8 w-24")} />
        ))}
      </div>
      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={`architecture-draft-row-skeleton-${index}`} className={cn(SKELETON_BLOCK_CLASS, "mb-3 w-full")} />
        ))}
      </div>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status">
        {ARCHITECTURES_HUB_LIST_SKELETON_STATUS}
      </p>
    </div>
  );
}
