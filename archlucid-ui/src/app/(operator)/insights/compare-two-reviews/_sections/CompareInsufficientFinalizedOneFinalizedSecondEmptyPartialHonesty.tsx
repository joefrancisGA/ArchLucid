"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { COMPARE_INSUFFICIENT_FINALIZED_ONE_FINALIZED_SECOND_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/architecture/compare-insufficient-finalized-one-finalized-second-empty-partial-capture-copy";

export function CompareInsufficientFinalizedOneFinalizedSecondEmptyPartialHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();
  if (!partialCapture) return null;
  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="compare-insufficient-finalized-one-finalized-second-empty-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={COMPARE_INSUFFICIENT_FINALIZED_ONE_FINALIZED_SECOND_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="compare-insufficient-finalized-one-finalized-second-empty-partial-capture-cloud"
      extractUploadTestId="compare-insufficient-finalized-one-finalized-second-empty-partial-extract"
    />
  );
}
