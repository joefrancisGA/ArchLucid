"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import type { CompareFindingCorrelationMetadata } from "@/lib/compare-finding-correlation";
import { compareFindingCorrelationCountsAreAllZero } from "@/lib/compare-finding-correlation-counts-all-zero";
import { COMPARE_FINDING_CORRELATION_ZERO_COUNTS_PARTIAL_CAPTURE_LINE } from "@/lib/compare-finding-correlation-zero-counts-partial-capture-copy";

export type CompareFindingCorrelationZeroCountsHonestyProps = {
  readonly metadata: CompareFindingCorrelationMetadata;
};

export function CompareFindingCorrelationZeroCountsHonesty(
  props: CompareFindingCorrelationZeroCountsHonestyProps,
): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture || !compareFindingCorrelationCountsAreAllZero(props.metadata)) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="compare-finding-correlation-zero-counts-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={COMPARE_FINDING_CORRELATION_ZERO_COUNTS_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="compare-finding-correlation-zero-counts-partial-capture-cloud"
      extractUploadTestId="compare-finding-correlation-zero-counts-partial-capture-extract"
    />
  );
}