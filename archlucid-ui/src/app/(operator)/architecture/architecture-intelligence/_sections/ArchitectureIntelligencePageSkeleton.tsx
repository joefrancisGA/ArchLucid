import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const SKELETON_BLOCK_CLASS = "h-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800";

/** Preserves intake form layout while architecture intelligence hydrates. */
export function ArchitectureIntelligencePageSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4" data-testid="architecture-intelligence-page-skeleton" aria-busy="true">
      <div className={cn(SKELETON_BLOCK_CLASS, "w-2/3 max-w-md")} />
      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <div className={cn(SKELETON_BLOCK_CLASS, "w-48")} />
        <div className={cn(SKELETON_BLOCK_CLASS, "mt-3 h-24 w-full")} />
      </div>
      <div className={cn(SKELETON_BLOCK_CLASS, "w-full max-w-xl")} />
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status">
        Loading architecture intelligence…
      </p>
    </div>
  );
}
