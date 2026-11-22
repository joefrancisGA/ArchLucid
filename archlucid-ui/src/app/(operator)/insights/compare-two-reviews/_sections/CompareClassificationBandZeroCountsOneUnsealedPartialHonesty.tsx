"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { COMPARE_CLASSIFICATION_BAND_ZERO_COUNTS_ONE_UNSEALED_PARTIAL_CAPTURE_LINE } from "@/lib/architecture/compare-classification-band-zero-counts-one-unsealed-partial-capture-copy";

export function CompareClassificationBandZeroCountsOneUnsealedPartialHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();
  if (!partialCapture) return null;
  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="compare-classification-band-zero-counts-one-unsealed-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={COMPARE_CLASSIFICATION_BAND_ZERO_COUNTS_ONE_UNSEALED_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="compare-classification-band-zero-counts-one-unsealed-partial-capture-cloud"
      extractUploadTestId="compare-classification-band-zero-counts-one-unsealed-partial-extract"
    />
  );
}
