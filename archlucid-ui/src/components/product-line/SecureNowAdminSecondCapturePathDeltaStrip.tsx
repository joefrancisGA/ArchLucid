"use client";

import { SecureNowSecondCapturePathDeltaHonestyStrip } from "@/components/product-line/SecureNowSecondCapturePathDeltaHonestyStrip";
import { useSecureNowLatestSucceededSnapshotId } from "@/hooks/use-securenow-latest-succeeded-snapshot-id";
import { useSecureNowNeedsSecondCapturePathDelta } from "@/hooks/use-securenow-needs-second-capture-path-delta";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";

export type SecureNowAdminSecondCapturePathDeltaStripProps = {
  readonly testIdPrefix: string;
};

/** SecureNow stickiness — second capture before path-id deltas with return-path recovery links. */
export function SecureNowAdminSecondCapturePathDeltaStrip(
  props: SecureNowAdminSecondCapturePathDeltaStripProps,
): React.JSX.Element | null {
  const needsSecondCapture = useSecureNowNeedsSecondCapturePathDelta(true);
  const returnPath = useSecureNowPartialCaptureReturnPath();
  const snapshotQuery = useSecureNowLatestSucceededSnapshotId();

  if (!needsSecondCapture) {
    return null;
  }

  return (
    <SecureNowSecondCapturePathDeltaHonestyStrip
      testId={`${props.testIdPrefix}-second-capture-path-delta`}
      returnPath={returnPath}
      cloudConnectionsTestId={`${props.testIdPrefix}-second-capture-cloud-connections`}
      extractUploadTestId={`${props.testIdPrefix}-second-capture-extract-upload`}
      partialCaptureSnapshotId={snapshotQuery.latestSnapshotId}
    />
  );
}
