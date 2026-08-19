import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SEARCH_PAGE_LOADING_STATUS } from "./search-page-copy";

const SKELETON_BLOCK_CLASS = "h-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800";

/** Preserves the search form card layout while the route shell hydrates. */
export function SearchPageSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4" data-testid="search-review-evidence-page-skeleton" aria-busy="true">
      <div className="max-w-xl rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <div className={cn(SKELETON_BLOCK_CLASS, "w-32")} />
        <div className={cn(SKELETON_BLOCK_CLASS, "mt-3 w-full")} />
        <div className={cn(SKELETON_BLOCK_CLASS, "mt-3 w-2/3")} />
        <div className={cn(SKELETON_BLOCK_CLASS, "mt-4 w-24")} />
      </div>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status">
        {SEARCH_PAGE_LOADING_STATUS}
      </p>
    </div>
  );
}
