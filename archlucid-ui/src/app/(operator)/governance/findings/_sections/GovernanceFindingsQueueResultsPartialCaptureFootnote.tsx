"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { GOVERNANCE_FINDINGS_RESULTS_PARTIAL_CAPTURE_LINE } from "@/lib/governance/governance-findings-results-partial-capture-copy";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function GovernanceFindingsQueueResultsPartialCaptureFootnote(): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const partialCapture = useLatestSnapshotCaptureIsPartial(isSecureNowProductLine(productLine));
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!isSecureNowProductLine(productLine) || !partialCapture) {
    return null;
  }

  return (
    <div className={cn("mt-3", OPERATOR_TYPOGRAPHY.helper)}>
      <SecureNowPartialCaptureRecoveryParagraph
        testId="governance-findings-results-partial-capture"
        partialCaptureSnapshotId={partialCaptureSnapshotId}
        returnPath={partialCaptureReturnPath}
        middleLine={GOVERNANCE_FINDINGS_RESULTS_PARTIAL_CAPTURE_LINE}
        cloudConnectionsTestId="governance-findings-results-partial-capture-cloud"
        extractUploadTestId="governance-findings-results-partial-capture-extract"
      />
    </div>
  );
}