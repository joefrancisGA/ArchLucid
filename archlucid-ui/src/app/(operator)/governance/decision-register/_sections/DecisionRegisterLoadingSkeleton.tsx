import { DECISION_REGISTER_LOADING_STATUS } from "../decision-register-copy";

/** Loading placeholder while workspace and filtered register queries resolve (GDO). */
export function DecisionRegisterLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className="space-y-3"
      data-testid="decision-register-loading-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={DECISION_REGISTER_LOADING_STATUS}
    >
      <p className="m-0 text-al-text-secondary">{DECISION_REGISTER_LOADING_STATUS}</p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="h-20 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-20 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-20 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-20 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
      </div>
    </div>
  );
}
