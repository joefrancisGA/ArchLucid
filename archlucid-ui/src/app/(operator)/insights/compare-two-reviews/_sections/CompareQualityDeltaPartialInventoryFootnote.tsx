"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { COMPARE_QUALITY_DELTA_PARTIAL_INVENTORY_FOOTNOTE } from "@/lib/architecture/compare-quality-delta-partial-inventory-footnote-copy";
import { COMPARE_QUALITY_DELTA_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-quality-delta-partial-capture-not-load-failure-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function CompareQualityDeltaPartialInventoryFootnote(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return (
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="compare-quality-delta-partial-inventory-footnote">
        {COMPARE_QUALITY_DELTA_PARTIAL_INVENTORY_FOOTNOTE}
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-2" data-testid="compare-quality-delta-partial-inventory-footnote">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {COMPARE_QUALITY_DELTA_PARTIAL_INVENTORY_FOOTNOTE}
      </p>
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="compare-quality-delta-partial-capture-not-load-failure"
      >
        {COMPARE_QUALITY_DELTA_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE}
      </p>
      <SecureNowPartialCaptureRecoveryParagraph
        testId="compare-quality-delta-partial-inventory-recovery"
        partialCaptureSnapshotId={partialCaptureSnapshotId}
        returnPath={partialCaptureReturnPath}
        middleLine={COMPARE_QUALITY_DELTA_PARTIAL_INVENTORY_FOOTNOTE}
        cloudConnectionsTestId="compare-quality-delta-partial-inventory-cloud"
        extractUploadTestId="compare-quality-delta-partial-inventory-extract"
      />
    </div>
  );
}
