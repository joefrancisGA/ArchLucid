"use client";

import { SecureNowPartialCaptureRecoveryLinks } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SECURENOW_SECOND_CAPTURE_PATH_DELTA_LINE } from "@/lib/product-line/securenow-second-capture-delta-copy";
import { SECURENOW_STICKINESS_NOT_USAGE_CLAIM } from "@/lib/product-line/securenow-stickiness";
import { cn } from "@/lib/utils";

export type SecureNowSecondCapturePathDeltaHonestyStripProps = {
  readonly testId: string;
  readonly returnPath: string;
  readonly middleLine?: string;
  readonly cloudConnectionsTestId: string;
  readonly extractUploadTestId: string;
  readonly partialCaptureSnapshotId?: string | null;
};

/** SecureNow stickiness — second capture before path-id deltas; optional recovery links with return path. */
export function SecureNowSecondCapturePathDeltaHonestyStrip(
  props: SecureNowSecondCapturePathDeltaHonestyStripProps,
): React.JSX.Element {
  return (
    <div className={cn("space-y-1", OPERATOR_TYPOGRAPHY.helper)} data-testid={props.testId}>
      <p className="m-0" data-testid={`${props.testId}-path-delta-line`}>
        {SECURENOW_SECOND_CAPTURE_PATH_DELTA_LINE}
      </p>
      <p className="m-0" data-testid={`${props.testId}-not-usage-claim`}>
        {SECURENOW_STICKINESS_NOT_USAGE_CLAIM}
      </p>
      <p className="m-0" data-testid={`${props.testId}-recovery`}>
        <SecureNowPartialCaptureRecoveryLinks
          partialCaptureSnapshotId={props.partialCaptureSnapshotId ?? null}
          returnPath={props.returnPath}
          middleLine={props.middleLine}
          cloudConnectionsTestId={props.cloudConnectionsTestId}
          extractUploadTestId={props.extractUploadTestId}
        />
      </p>
    </div>
  );
}
