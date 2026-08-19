import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Loading placeholder for coordinator provenance (graph + timeline). */
export default function RunProvenanceLoading() {
  return (
    <div className="w-full max-w-[1160px] p-4" data-testid="provenance-page-loading">
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div
          className={cn(
            "h-[580px] w-full animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900",
          )}
          aria-hidden="true"
        />
        <p className={cn("sr-only", OPERATOR_TYPOGRAPHY.helper)}>Loading provenance graph and timeline…</p>
      </div>
    </div>
  );
}
