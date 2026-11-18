"use client";

import { SecureNowInfraPartialCaptureStrip } from "@/components/product-line/SecureNowInfraPartialCaptureStrip";
import { REMEDIATION_WORKBENCH_STATUS_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/infra-evidence/remediation-workbench-status-filter-empty-partial-capture-copy";

export function RemediationWorkbenchStatusFilterEmptyPartialHonesty(): React.JSX.Element | null {
  return (
    <SecureNowInfraPartialCaptureStrip
      testId="infra-remediation-status-filter-empty-partial-capture"
      middleLine={REMEDIATION_WORKBENCH_STATUS_FILTER_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="infra-remediation-status-filter-empty-partial-cloud"
      extractUploadTestId="infra-remediation-status-filter-empty-partial-extract"
    />
  );
}