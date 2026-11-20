"use client";
import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { COMPARE_GOVERNANCE_DIFF_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/architecture/compare-governance-diff-empty-partial-capture-copy";
export function CompareGovernanceDiffEmptyPartialHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();
  if (!partialCapture) return null;
  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="compare-governance-diff-empty-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={COMPARE_GOVERNANCE_DIFF_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="compare-governance-diff-empty-partial-capture-cloud"
      extractUploadTestId="compare-governance-diff-empty-partial-extract"
    />
  );
}
