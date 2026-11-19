"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { GOVERNANCE_FINDINGS_QUEUE_HEADER_PARTIAL_CAPTURE_LINE } from "@/lib/governance/governance-findings-queue-header-partial-capture-copy";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function GovernanceFindingsQueueHeaderPartialCaptureHonesty(): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const partialCapture = useLatestSnapshotCaptureIsPartial(isSecureNowProductLine(productLine));
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!isSecureNowProductLine(productLine) || !partialCapture) {
    return null;
  }

  return (
    <div className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="governance-findings-queue-header-partial-capture">
      <SecureNowPartialCaptureRecoveryParagraph
        testId="governance-findings-queue-header-partial-capture-recovery"
        partialCaptureSnapshotId={partialCaptureSnapshotId}
        returnPath={partialCaptureReturnPath}
        middleLine={GOVERNANCE_FINDINGS_QUEUE_HEADER_PARTIAL_CAPTURE_LINE}
        cloudConnectionsTestId="governance-findings-queue-header-partial-capture-cloud"
        extractUploadTestId="governance-findings-queue-header-partial-capture-extract"
      />
    </div>
  );
}
