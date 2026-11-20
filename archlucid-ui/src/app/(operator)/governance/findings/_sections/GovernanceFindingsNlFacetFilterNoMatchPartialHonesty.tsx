"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_FINDINGS_NL_FACET_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-nl-facet-filter-empty-not-load-failure-copy";
import { GOVERNANCE_FINDINGS_NL_FACET_FILTER_NO_MATCH_PARTIAL_CAPTURE_LINE } from "@/lib/governance/governance-findings-nl-facet-filter-no-match-partial-capture-copy";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { cn } from "@/lib/utils";

export function GovernanceFindingsNlFacetFilterNoMatchPartialHonesty(): React.JSX.Element {
  const { productLine } = useProductLine();
  const partialCapture = useLatestSnapshotCaptureIsPartial(isSecureNowProductLine(productLine));
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  return (
    <div className="space-y-2" data-testid="governance-findings-nl-facet-filter-no-match">
      <p
        className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="governance-findings-nl-facet-filter-empty-not-load-failure"
      >
        {GOVERNANCE_FINDINGS_NL_FACET_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE}
      </p>
      {isSecureNowProductLine(productLine) && partialCapture ? (
        <SecureNowPartialCaptureRecoveryParagraph
          testId="governance-findings-nl-facet-filter-no-match-partial-capture"
          partialCaptureSnapshotId={partialCaptureSnapshotId}
          returnPath={partialCaptureReturnPath}
          middleLine={GOVERNANCE_FINDINGS_NL_FACET_FILTER_NO_MATCH_PARTIAL_CAPTURE_LINE}
          cloudConnectionsTestId="governance-findings-nl-facet-filter-no-match-partial-cloud"
          extractUploadTestId="governance-findings-nl-facet-filter-no-match-partial-extract"
        />
      ) : null}
    </div>
  );
}