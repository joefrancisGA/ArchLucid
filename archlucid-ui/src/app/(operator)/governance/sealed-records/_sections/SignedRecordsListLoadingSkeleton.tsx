import { SIGNED_RECORDS_LIST_LOADING_STATUS } from "./signed-records-list-page-copy";

/** Loading placeholder while the finalized review records list resolves (SI). */
export function SignedRecordsListLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className="space-y-3"
      data-testid="signed-records-list-loading-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={SIGNED_RECORDS_LIST_LOADING_STATUS}
    >
      <p className="m-0 text-al-text-secondary">{SIGNED_RECORDS_LIST_LOADING_STATUS}</p>
      <div className="h-48 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}
