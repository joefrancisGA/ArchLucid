"use client";

import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { SECURENOW_WORKSPACE_HEALTH_PARTIAL_CAPTURE_LINE } from "@/lib/insights/securenow-workspace-health-partial-capture-copy";

import { SecureNowPartialCaptureRecoveryParagraph } from "./SecureNowPartialCaptureRecoveryLinks";

/** Insights workspace health — partial capture before KPI tiles. */
export function SecureNowWorkspaceHealthPartialCaptureStrip(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="workspace-health-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={SECURENOW_WORKSPACE_HEALTH_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="workspace-health-partial-capture-cloud"
      extractUploadTestId="workspace-health-partial-capture-extract"
    />
  );
}