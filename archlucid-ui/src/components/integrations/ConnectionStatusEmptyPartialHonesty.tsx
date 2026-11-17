"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { CONNECTION_STATUS_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/administration/connection-status-empty-partial-capture-copy";

export function ConnectionStatusEmptyPartialHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="connection-status-empty-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={CONNECTION_STATUS_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="connection-status-empty-partial-capture-cloud"
      extractUploadTestId="connection-status-empty-partial-capture-extract"
    />
  );
}