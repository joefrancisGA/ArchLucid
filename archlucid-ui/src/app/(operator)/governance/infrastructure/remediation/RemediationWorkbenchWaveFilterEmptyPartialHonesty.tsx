"use client";

import { SecureNowInfraPartialCaptureStrip } from "@/components/product-line/SecureNowInfraPartialCaptureStrip";
import { REMEDIATION_WORKBENCH_WAVE_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/infra-evidence/remediation-workbench-wave-filter-empty-partial-capture-copy";

export function RemediationWorkbenchWaveFilterEmptyPartialHonesty(): React.JSX.Element | null {
  return (
    <SecureNowInfraPartialCaptureStrip
      testId="infra-remediation-wave-filter-empty-partial-capture"
      middleLine={REMEDIATION_WORKBENCH_WAVE_FILTER_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="infra-remediation-wave-filter-empty-partial-cloud"
      extractUploadTestId="infra-remediation-wave-filter-empty-partial-extract"
    />
  );
}