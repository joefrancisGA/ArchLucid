import { SEALED_RECORD_DETAIL_LOADING_STATUS } from "@/lib/sealed-record-detail-page-copy";

/** Loading placeholder while manifest detail resolves (MMX). */
export function ManifestDetailLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className="space-y-3"
      data-testid="sealed-record-detail-loading-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={SEALED_RECORD_DETAIL_LOADING_STATUS}
    >
      <p className="m-0 text-al-text-secondary">{SEALED_RECORD_DETAIL_LOADING_STATUS}</p>
      <div className="h-48 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}
