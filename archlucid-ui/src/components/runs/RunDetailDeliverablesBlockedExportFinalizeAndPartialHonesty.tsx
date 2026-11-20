"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { RUN_DETAIL_DELIVERABLES_BLOCKED_EXPORT_FINALIZE_AND_PARTIAL_CAPTURE_PARTIAL_LINE } from "@/lib/runs/run-detail-deliverables-blocked-export-finalize-and-partial-capture-partial-capture-copy";

export function RunDetailDeliverablesBlockedExportFinalizeAndPartialHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="run-detail-deliverables-blocked-export-finalize-and-partial-capture-recovery"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={RUN_DETAIL_DELIVERABLES_BLOCKED_EXPORT_FINALIZE_AND_PARTIAL_CAPTURE_PARTIAL_LINE}
      cloudConnectionsTestId="run-detail-deliverables-blocked-export-finalize-and-partial-capture-cloud"
      extractUploadTestId="run-detail-deliverables-blocked-export-finalize-and-partial-capture-extract"
    />
  );
}
