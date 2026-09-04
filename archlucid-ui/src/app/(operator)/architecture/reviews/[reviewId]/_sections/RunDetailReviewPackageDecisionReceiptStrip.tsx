"use client";

import { DecisionReceiptExportButton } from "@/components/draft-intake/DecisionReceiptExportButton";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RunDetailReviewPackageDecisionReceiptStripProps = {
  readonly runId: string;
  readonly feasibilityVerdict: ManifestFeasibilityVerdict | null | undefined;
};

/** Sealed-review decision receipt on the stamp band, not only Artifacts (WA-13). */
export function RunDetailReviewPackageDecisionReceiptStrip(
  props: RunDetailReviewPackageDecisionReceiptStripProps,
): React.JSX.Element | null {
  const verdict = props.feasibilityVerdict;

  if (verdict === null || verdict === undefined) {
    return null;
  }

  return (
    <div
      className="mb-3 flex flex-wrap items-center gap-3 rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800"
      data-testid="run-detail-stamp-decision-receipt-strip"
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Export the decision receipt from the stamp band — Artifacts keeps a duplicate copy.
      </p>
      <DecisionReceiptExportButton
        context={{
          source: "committed-run",
          runId: props.runId,
          verdict,
        }}
      />
    </div>
  );
}
