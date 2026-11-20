"use client";

import { SecureNowInfraPartialCaptureStrip } from "@/components/product-line/SecureNowInfraPartialCaptureStrip";
import { REMEDIATION_WORKBENCH_COMBINED_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/infra-evidence/remediation-workbench-combined-filter-empty-partial-capture-copy";

export function RemediationWorkbenchCombinedFilterEmptyPartialHonesty(): React.JSX.Element | null {
  return (
    <SecureNowInfraPartialCaptureStrip
      testId="infra-remediation-combined-filter-empty-partial-capture"
      middleLine={REMEDIATION_WORKBENCH_COMBINED_FILTER_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="infra-remediation-combined-filter-empty-partial-cloud"
      extractUploadTestId="infra-remediation-combined-filter-empty-partial-extract"
    />
  );
}