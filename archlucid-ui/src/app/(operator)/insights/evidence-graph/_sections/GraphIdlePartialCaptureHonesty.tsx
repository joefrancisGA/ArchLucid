"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { EVIDENCE_GRAPH_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/insights/evidence-graph-empty-partial-capture-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function GraphIdlePartialCaptureHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <div className={cn("mt-2", OPERATOR_TYPOGRAPHY.helper)}>
      <SecureNowPartialCaptureRecoveryParagraph
        testId="evidence-graph-idle-partial-capture"
        partialCaptureSnapshotId={partialCaptureSnapshotId}
        returnPath={partialCaptureReturnPath}
        middleLine={EVIDENCE_GRAPH_EMPTY_PARTIAL_CAPTURE_LINE}
        cloudConnectionsTestId="evidence-graph-idle-partial-capture-cloud"
        extractUploadTestId="evidence-graph-idle-partial-capture-extract"
      />
    </div>
  );
}