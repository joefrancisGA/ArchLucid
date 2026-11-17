"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { EVIDENCE_GRAPH_LOADED_ZERO_NODES_PARTIAL_CAPTURE_LINE } from "@/lib/insights/evidence-graph-loaded-zero-nodes-partial-capture-copy";

export function GraphLoadedZeroNodesPartialCaptureHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="evidence-graph-loaded-zero-nodes-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={EVIDENCE_GRAPH_LOADED_ZERO_NODES_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="evidence-graph-loaded-zero-nodes-partial-capture-cloud"
      extractUploadTestId="evidence-graph-loaded-zero-nodes-partial-capture-extract"
    />
  );
}