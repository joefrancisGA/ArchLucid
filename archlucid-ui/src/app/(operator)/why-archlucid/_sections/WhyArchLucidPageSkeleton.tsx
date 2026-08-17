import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { WHY_ARCHLUCID_PAGE_LOADING_STATUS } from "@/lib/why-archlucid-page-copy";

const SKELETON_BLOCK_CLASS = "h-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800";

/** Preserves page rhythm while pilot telemetry bundles hydrate. */
export function WhyArchLucidPageSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4" data-testid="why-archlucid-page-skeleton" aria-busy="true">
      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <div className={cn(SKELETON_BLOCK_CLASS, "w-40")} />
        <div className={cn(SKELETON_BLOCK_CLASS, "mt-3 w-full")} />
        <div className={cn(SKELETON_BLOCK_CLASS, "mt-3 w-2/3")} />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-24 animate-pulse rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/60" />
          <div className="h-24 animate-pulse rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/60" />
          <div className="h-24 animate-pulse rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/60" />
          <div className="h-24 animate-pulse rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/60" />
        </div>
      </div>
      <div className="h-10 w-64 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" aria-hidden="true" />
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status">
        {WHY_ARCHLUCID_PAGE_LOADING_STATUS}
      </p>
    </div>
  );
}
