"use client";

import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";

import { SecureNowPartialCaptureRecoveryParagraph } from "./SecureNowPartialCaptureRecoveryLinks";

/** Cloud connections — partial capture distinct from collection-missing blocker. */
export function SecureNowCloudConnectionsPartialCaptureStrip(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="cloud-connections-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      cloudConnectionsTestId="cloud-connections-partial-capture-cloud-connections"
      extractUploadTestId="cloud-connections-partial-capture-extract-upload"
    />
  );
};