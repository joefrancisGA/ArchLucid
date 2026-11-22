"use client";

import { SecureNowInfraPartialCaptureStrip } from "@/components/product-line/SecureNowInfraPartialCaptureStrip";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { POLICY_PACKS_WORKSPACE_SELECTION_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/policy/policy-packs-workspace-selection-empty-partial-capture-copy";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

export function PolicyPacksWorkspaceSelectionEmptyPartialHonesty(): React.JSX.Element | null {
  const { productLine } = useProductLine();

  if (!isSecureNowProductLine(productLine)) {
    return null;
  }

  return (
    <SecureNowInfraPartialCaptureStrip
      testId="policy-packs-workspace-selection-empty-partial-capture"
      middleLine={POLICY_PACKS_WORKSPACE_SELECTION_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="policy-packs-workspace-selection-empty-partial-capture-cloud"
      extractUploadTestId="policy-packs-workspace-selection-empty-partial-capture-extract"
    />
  );
}