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
      className="rounded-lg border border-amber-300/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-50"
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
