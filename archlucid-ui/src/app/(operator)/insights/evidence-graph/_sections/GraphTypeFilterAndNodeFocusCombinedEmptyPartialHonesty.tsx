"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { EVIDENCE_GRAPH_TYPE_FILTER_AND_NODE_FOCUS_COMBINED_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/insights/evidence-graph-type-filter-and-node-focus-combined-empty-partial-capture-copy";

export function GraphTypeFilterAndNodeFocusCombinedEmptyPartialHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="evidence-graph-type-filter-and-node-focus-combined-empty-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={EVIDENCE_GRAPH_TYPE_FILTER_AND_NODE_FOCUS_COMBINED_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="evidence-graph-type-filter-and-node-focus-combined-empty-partial-capture-cloud"
      extractUploadTestId="evidence-graph-type-filter-and-node-focus-combined-empty-partial-capture-extract"
    />
  );
}
