import { POLICY_PACKS_LOADING_STATUS } from "./policy-packs-page-copy";

/** Loading placeholder while the policy packs bundle query resolves (GPP). */
export function PolicyPacksLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className="space-y-3"
      data-testid="policy-packs-loading-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={POLICY_PACKS_LOADING_STATUS}
    >
      <p className="m-0 text-al-text-secondary">{POLICY_PACKS_LOADING_STATUS}</p>
      <div className="h-48 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}
