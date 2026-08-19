import { RISK_EXCEPTIONS_LOADING_STATUS } from "../risk-exceptions-page-copy";

/** Loading placeholder while the exceptions register query resolves (GRO). */
export function RiskExceptionsLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className="space-y-3"
      data-testid="risk-exceptions-loading-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={RISK_EXCEPTIONS_LOADING_STATUS}
    >
      <p className="m-0 text-al-text-secondary">{RISK_EXCEPTIONS_LOADING_STATUS}</p>
      <div className="h-48 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}
