"use client";

import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { GOVERNANCE_APPROVAL_LIST_LOAD_FAILURE_PARTIAL_CAPTURE_LINE } from "@/lib/governance/governance-approval-list-load-failure-partial-capture-copy";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

export function GovernanceWorkflowApprovalsListLoadFailureHonesty(props: {
  readonly listFailure: ApiLoadFailureState | null;
}): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const partialCapture = useLatestSnapshotCaptureIsPartial(isSecureNowProductLine(productLine));
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (props.listFailure === null) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="governance-approval-list-load-failure-honesty">
      <FatalPageReportProblemSupportRow
        surfaceId="governance-approval-requests-list-read-failed"
        errorTitle="Governance approval requests"
        errorCode="governance-approval-list-load-failed"
        correlationId={props.listFailure.correlationId ?? null}
        httpStatus={props.listFailure.httpStatus ?? null}
      />
      {isSecureNowProductLine(productLine) && partialCapture ? (
        <SecureNowPartialCaptureRecoveryParagraph
          testId="governance-approval-list-load-failure-partial-capture"
          partialCaptureSnapshotId={partialCaptureSnapshotId}
          returnPath={partialCaptureReturnPath}
          middleLine={GOVERNANCE_APPROVAL_LIST_LOAD_FAILURE_PARTIAL_CAPTURE_LINE}
          cloudConnectionsTestId="governance-approval-list-load-failure-partial-cloud"
          extractUploadTestId="governance-approval-list-load-failure-partial-extract"
        />
      ) : null}
    </div>
  );
}