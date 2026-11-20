"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { COMPARE_WORKSPACE_UNSEALED_PARTIAL_CAPTURE_LINE } from "@/lib/architecture/compare-workspace-unsealed-partial-capture-copy";

export function CompareWorkspaceUnsealedPartialHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="compare-workspace-unsealed-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={COMPARE_WORKSPACE_UNSEALED_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="compare-workspace-unsealed-partial-capture-cloud"
      extractUploadTestId="compare-workspace-unsealed-partial-extract"
    />
  );
}
