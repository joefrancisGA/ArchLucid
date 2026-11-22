"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { COMPARE_RUN_PICKERS_CORRELATION_EMPTY_AND_SEAL_PARTIAL_CAPTURE_LINE } from "@/lib/architecture/compare-run-pickers-correlation-empty-and-seal-partial-capture-copy";

export function CompareRunPickersCorrelationEmptyAndSealPartialHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="compare-run-pickers-correlation-empty-and-seal-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={COMPARE_RUN_PICKERS_CORRELATION_EMPTY_AND_SEAL_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="compare-run-pickers-correlation-empty-and-seal-partial-capture-cloud"
      extractUploadTestId="compare-run-pickers-correlation-empty-and-seal-partial-capture-extract"
    />
  );
}
