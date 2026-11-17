"use client";

import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";

import { SecureNowPartialCaptureRecoveryParagraph } from "./SecureNowPartialCaptureRecoveryLinks";

export type SecureNowInfraPartialCaptureStripProps = {
  readonly testId: string;
  readonly middleLine: string;
  readonly cloudConnectionsTestId: string;
  readonly extractUploadTestId: string;
};

/** Infrastructure workbenches — partial capture with a surface-specific middle line. */
export function SecureNowInfraPartialCaptureStrip(
  props: SecureNowInfraPartialCaptureStripProps,
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
      middleLine={props.middleLine}
      cloudConnectionsTestId={props.cloudConnectionsTestId}
      extractUploadTestId={props.extractUploadTestId}
    />
  );
}