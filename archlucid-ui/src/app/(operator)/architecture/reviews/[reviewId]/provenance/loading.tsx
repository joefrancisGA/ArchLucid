import { cn } from "@/lib/utils";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Loading placeholder for coordinator provenance (graph + timeline). */
export default function RunProvenanceLoading() {
  return (
    <OperatorPageContainer variant="dashboard" data-testid="provenance-page-loading">
      <div className={OPERATOR_LAYOUT.sectionStack}>
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
    </OperatorPageContainer>
  );
}
