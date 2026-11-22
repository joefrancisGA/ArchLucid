"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { GOVERNANCE_FINDINGS_ARCHITECTURE_SCOPE_AND_SEVERITY_COMBINED_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/governance/governance-findings-architecture-scope-and-severity-combined-filter-empty-partial-capture-copy";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

export function GovernanceFindingsArchitectureScopeAndSeverityFilterNoMatchPartialHonesty(): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const partialCapture = useLatestSnapshotCaptureIsPartial(isSecureNowProductLine(productLine));
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!isSecureNowProductLine(productLine) || !partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="governance-findings-architecture-scope-and-severity-combined-filter-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={GOVERNANCE_FINDINGS_ARCHITECTURE_SCOPE_AND_SEVERITY_COMBINED_FILTER_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="governance-findings-architecture-scope-and-severity-combined-partial-cloud"
      extractUploadTestId="governance-findings-architecture-scope-and-severity-combined-partial-extract"
    />
  );
}
