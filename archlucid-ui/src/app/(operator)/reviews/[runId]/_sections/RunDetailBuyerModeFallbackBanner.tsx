import type { ReactElement } from "react";

type RunDetailBuyerModeFallbackBannerProps = {
  readonly realModeFellBackToSimulator: boolean;
};

/**
 * Buyer-mode callout shown when a run requested real mode but the backend fell back to simulator execution.
 */
export function RunDetailBuyerModeFallbackBanner(
  props: RunDetailBuyerModeFallbackBannerProps,
): ReactElement | null {
  if (!props.realModeFellBackToSimulator) {
    return null;
  }

  return (
    <div
      className="rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 px-4 py-3 text-sm shadow-sm"
      role="alert"
      data-testid="run-detail-buyer-fallback-banner"
    >
      <p className="m-0 font-semibold">Real mode unavailable for this run</p>
      <p className="m-0 mt-1 leading-snug">
        This review package used simulator fallback because real-mode execution was unavailable at run time.
      </p>
    </div>
  );
}
