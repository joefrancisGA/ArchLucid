"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { GOVERNANCE_APPROVAL_LINEAGE_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/governance/governance-approval-lineage-empty-partial-capture-copy";

export type GovernanceApprovalLineagePartialEmptyHonestyProps = {
  readonly testId: string;
  readonly cloudConnectionsTestId: string;
  readonly extractUploadTestId: string;
};

export function GovernanceApprovalLineagePartialEmptyHonesty(
  props: GovernanceApprovalLineagePartialEmptyHonestyProps,
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
      middleLine={GOVERNANCE_APPROVAL_LINEAGE_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId={props.cloudConnectionsTestId}
      extractUploadTestId={props.extractUploadTestId}
    />
  );
}