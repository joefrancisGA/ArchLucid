"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import {
  CONNECTION_STATUS_DASHBOARD_PARTIAL_CAPTURE_LINE,
  CONNECTION_STATUS_DASHBOARD_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE,
} from "@/lib/integrations/connection-status-dashboard-partial-capture-copy";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function ConnectionStatusDashboardPartialCaptureHonesty(): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const partialCapture = useLatestSnapshotCaptureIsPartial(isSecureNowProductLine(productLine));
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!isSecureNowProductLine(productLine) || !partialCapture) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="connection-status-dashboard-partial-capture">
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="connection-status-dashboard-partial-capture-not-load-failure"
      >
        {CONNECTION_STATUS_DASHBOARD_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE}
      </p>
      <SecureNowPartialCaptureRecoveryParagraph
        testId="connection-status-dashboard-partial-capture-recovery"
        partialCaptureSnapshotId={partialCaptureSnapshotId}
        returnPath={partialCaptureReturnPath}
        middleLine={CONNECTION_STATUS_DASHBOARD_PARTIAL_CAPTURE_LINE}
        cloudConnectionsTestId="connection-status-dashboard-partial-capture-cloud"
        extractUploadTestId="connection-status-dashboard-partial-capture-extract"
      />
    </div>
  );
}
