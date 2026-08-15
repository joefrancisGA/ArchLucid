import type { ReactElement } from "react";

/** Placeholder while decision delta findings are derived from run detail. */
export function RunDetailDecisionDeltaSkeleton(): ReactElement {
  return (
    <div
      className="h-28 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
      role="status"
      aria-label="Loading decision delta"
      data-testid="run-detail-decision-delta-skeleton"
    />
  );
}
