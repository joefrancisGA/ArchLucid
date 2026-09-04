import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { resolveProductionEvalChromeFromStorage } from "@/lib/resolve-production-eval-chrome-from-storage";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type RunDetailBuyerModeFallbackBannerProps = {
  readonly realModeFellBackToSimulator: boolean;
};

/**
 * Buyer-mode callout shown when a run requested real mode but the backend fell back to simulator execution.
 */
export function RunDetailBuyerModeFallbackBanner(
  props: RunDetailBuyerModeFallbackBannerProps,
): ReactElement | null {
  if (!props.realModeFellBackToSimulator || resolveProductionEvalChromeFromStorage()) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-md border border-amber-600/40 bg-al-surface-raised px-4 py-3 text-al-text-primary shadow-sm dark:border-amber-700/50",
        OPERATOR_TYPOGRAPHY.body,
      )}
      role="alert"
      data-testid="run-detail-buyer-fallback-banner"
    >
      <p className="m-0 font-semibold">Real mode unavailable for this review</p>
      <p className="m-0 mt-1 leading-snug">
        This review used simulator fallback because real-mode execution was unavailable at run time.
      </p>
    </div>
  );
}
