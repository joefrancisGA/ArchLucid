"use client";

import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { REMEDIATION_WORKBENCH_PARTIAL_CAPTURE_LINE } from "@/lib/infra-evidence/remediation-workbench-partial-capture-honesty-copy";

import { SecureNowPartialCaptureRecoveryParagraph } from "./SecureNowPartialCaptureRecoveryLinks";

export function SecureNowRemediationWorkbenchPartialCaptureStrip(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="infra-remediation-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={REMEDIATION_WORKBENCH_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="infra-remediation-partial-capture-cloud"
      extractUploadTestId="infra-remediation-partial-capture-extract"
    />
  );
}