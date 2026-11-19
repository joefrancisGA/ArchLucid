"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { REMEDIATION_FACTORY_RANKED_PATHS_LOAD_FAILURE_PARTIAL_CAPTURE_LINE } from "@/lib/remediation-factory/remediation-factory-ranked-paths-load-failure-partial-capture-copy";

export function RemediationFactoryRankedPathsLoadFailurePartialHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="remediation-factory-ranked-paths-load-failure-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={REMEDIATION_FACTORY_RANKED_PATHS_LOAD_FAILURE_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="remediation-factory-ranked-paths-load-failure-partial-cloud"
      extractUploadTestId="remediation-factory-ranked-paths-load-failure-partial-extract"
    />
  );
}