"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { COMPARE_PROVENANCE_DELTA_PARTIAL_INVENTORY_PARTIAL_CAPTURE_LINE } from "@/lib/architecture/compare-provenance-delta-partial-inventory-partial-capture-copy";

export function CompareProvenanceDeltaPartialInventoryPartialHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();
  if (!partialCapture) return null;
  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="compare-provenance-delta-partial-inventory-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={COMPARE_PROVENANCE_DELTA_PARTIAL_INVENTORY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="compare-provenance-delta-partial-inventory-partial-capture-cloud"
      extractUploadTestId="compare-provenance-delta-partial-inventory-partial-extract"
    />
  );
}
