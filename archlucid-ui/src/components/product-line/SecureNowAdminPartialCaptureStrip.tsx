"use client";

import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";

import { SecureNowPartialCaptureRecoveryParagraph } from "./SecureNowPartialCaptureRecoveryLinks";

export type SecureNowAdminPartialCaptureStripProps = {
  readonly testId: string;
  readonly cloudConnectionsTestId: string;
  readonly extractUploadTestId: string;
};

/** Admin spine pages — partial capture when the latest snapshot completed with gaps. */
export function SecureNowAdminPartialCaptureStrip(
  props: SecureNowAdminPartialCaptureStripProps,
): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId={props.testId}
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      cloudConnectionsTestId={props.cloudConnectionsTestId}
      extractUploadTestId={props.extractUploadTestId}
    />
  );
};