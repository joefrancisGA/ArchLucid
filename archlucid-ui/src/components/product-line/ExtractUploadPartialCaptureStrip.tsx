"use client";

import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { EXTRACT_UPLOAD_ACCEPTED_PARTIAL_CAPTURE_LINE } from "@/lib/extract-upload/extract-upload-partial-capture-honesty-copy";

import { SecureNowPartialCaptureRecoveryParagraph } from "./SecureNowPartialCaptureRecoveryLinks";

export function ExtractUploadPartialCaptureStrip(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="extract-upload-accepted-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={EXTRACT_UPLOAD_ACCEPTED_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="extract-upload-partial-capture-cloud"
      extractUploadTestId="extract-upload-partial-capture-extract"
    />
  );
}