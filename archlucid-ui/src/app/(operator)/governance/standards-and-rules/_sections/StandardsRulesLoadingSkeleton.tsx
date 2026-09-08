import { STANDARDS_RULES_LOADING_STATUS } from "@/lib/standards-rules-page";

/** Loading placeholder while the standards-and-rules client chunk resolves (GRS). */
export function StandardsRulesLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className="space-y-3"
      data-testid="standards-rules-loading-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={STANDARDS_RULES_LOADING_STATUS}
    >
      <p className="m-0 text-al-text-secondary">{STANDARDS_RULES_LOADING_STATUS}</p>
      <div className="h-48 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}
