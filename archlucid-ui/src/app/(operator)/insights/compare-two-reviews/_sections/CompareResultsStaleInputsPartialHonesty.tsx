"use client";
import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { COMPARE_RESULTS_STALE_INPUTS_PARTIAL_CAPTURE_LINE } from "@/lib/architecture/compare-results-stale-inputs-partial-capture-copy";
export function CompareResultsStaleInputsPartialHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();
  if (!partialCapture) return null;
  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="compare-results-stale-inputs-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={COMPARE_RESULTS_STALE_INPUTS_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="compare-results-stale-inputs-partial-capture-cloud"
      extractUploadTestId="compare-results-stale-inputs-partial-extract"
    />
  );
}
