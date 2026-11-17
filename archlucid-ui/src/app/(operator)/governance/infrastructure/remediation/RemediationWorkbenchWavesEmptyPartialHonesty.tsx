"use client";

import { SecureNowInfraPartialCaptureStrip } from "@/components/product-line/SecureNowInfraPartialCaptureStrip";
import { REMEDIATION_WORKBENCH_WAVES_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/infra-evidence/remediation-workbench-waves-empty-partial-capture-copy";

export function RemediationWorkbenchWavesEmptyPartialHonesty(): React.JSX.Element | null {
  return (
    <SecureNowInfraPartialCaptureStrip
      testId="infra-remediation-waves-empty-partial-capture"
      middleLine={REMEDIATION_WORKBENCH_WAVES_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="infra-remediation-waves-empty-partial-capture-cloud"
      extractUploadTestId="infra-remediation-waves-empty-partial-capture-extract"
    />
  );
}