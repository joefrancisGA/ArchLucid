"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { COMPARE_VERDICT_ADD_REMOVE_TWO_SEALED_PARTIAL_CAPTURE_LINE } from "@/lib/architecture/compare-verdict-add-remove-two-sealed-partial-capture-copy";

export function CompareVerdictAddRemoveTwoSealedPartialHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();
  if (!partialCapture) return null;
  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="compare-verdict-add-remove-two-sealed-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={COMPARE_VERDICT_ADD_REMOVE_TWO_SEALED_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="compare-verdict-add-remove-two-sealed-partial-capture-cloud"
      extractUploadTestId="compare-verdict-add-remove-two-sealed-partial-extract"
    />
  );
}
