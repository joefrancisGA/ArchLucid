import { PILOT_OUTCOMES_LOADING_STATUS } from "@/lib/pilot-outcomes-page-copy";

/** Loading placeholder while sponsor report JSON resolves (SPP). */
export function PilotOutcomesLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className="space-y-3"
      data-testid="pilot-outcomes-loading-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={PILOT_OUTCOMES_LOADING_STATUS}
    >
      <p className="m-0 text-al-text-secondary">{PILOT_OUTCOMES_LOADING_STATUS}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-20 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-20 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-20 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-20 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
      </div>
    </div>
  );
}
