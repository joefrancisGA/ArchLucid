import { POLICY_PACK_DETAIL_LOADING_STATUS } from "@/lib/policy/policy-pack-detail-page-copy";

/** Loading placeholder while policy pack detail resolves (GPI). */
export function PolicyPackDetailLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className="space-y-3 px-4 pb-4"
      data-testid="policy-pack-detail-loading-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={POLICY_PACK_DETAIL_LOADING_STATUS}
    >
      <p className="m-0 text-al-text-secondary">{POLICY_PACK_DETAIL_LOADING_STATUS}</p>
      <div className="h-48 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}
