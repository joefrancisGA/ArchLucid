"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import {
  RUN_DETAIL_FINDINGS_HEADER_PARTIAL_CAPTURE_LINE,
  RUN_DETAIL_FINDINGS_HEADER_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE,
} from "@/lib/findings/run-detail-findings-header-partial-capture-copy";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function RunDetailFindingsHeaderPartialCaptureHonesty(): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const partialCapture = useLatestSnapshotCaptureIsPartial(isSecureNowProductLine(productLine));
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!isSecureNowProductLine(productLine) || !partialCapture) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="run-detail-findings-header-partial-capture">
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="run-detail-findings-header-partial-capture-not-load-failure"
      >
        {RUN_DETAIL_FINDINGS_HEADER_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE}
      </p>
      <SecureNowPartialCaptureRecoveryParagraph
        testId="run-detail-findings-header-partial-capture-recovery"
        partialCaptureSnapshotId={partialCaptureSnapshotId}
        returnPath={partialCaptureReturnPath}
        middleLine={RUN_DETAIL_FINDINGS_HEADER_PARTIAL_CAPTURE_LINE}
        cloudConnectionsTestId="run-detail-findings-header-partial-capture-cloud"
        extractUploadTestId="run-detail-findings-header-partial-capture-extract"
      />
    </div>
  );
}
