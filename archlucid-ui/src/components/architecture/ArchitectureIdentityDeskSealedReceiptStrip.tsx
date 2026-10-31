"use client";

import { DecisionReceiptExportButton } from "@/components/draft-intake/DecisionReceiptExportButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";
import { cn } from "@/lib/utils";

type ArchitectureIdentityDeskSealedReceiptStripProps = {
  readonly runId: string;
  readonly manifestVersion: string;
  readonly feasibilityVerdict?: ManifestFeasibilityVerdict | null;
};

/** SG-023: sealed child decision receipt export on the architecture desk, not only in review-detail. */
export function ArchitectureIdentityDeskSealedReceiptStrip(
  props: ArchitectureIdentityDeskSealedReceiptStripProps,
): React.JSX.Element {
  const verdict = props.feasibilityVerdict;

  if (verdict === null || verdict === undefined) {
    return (
      <div
        className="flex flex-wrap items-center gap-3"
        data-testid="architecture-identity-desk-sealed-receipt-strip"
      >
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
          Feasibility verdict was not stored. Open the sealed review to export a decision receipt.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap items-center gap-3"
      data-testid="architecture-identity-desk-sealed-receipt-strip"
    >
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        Download the decision receipt for the latest sealed review without opening the job inspector.
      </p>
      <DecisionReceiptExportButton
        context={{
          source: "committed-run",
          runId: props.runId,
          verdict,
        }}
        manifestVersion={props.manifestVersion}
      />
    </div>
  );
}
