"use client";

import { SecureNowInfraPartialCaptureStrip } from "@/components/product-line/SecureNowInfraPartialCaptureStrip";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { RESOURCE_EXPLORER_RESOURCE_GROUP_ONLY_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/infra-evidence/resource-explorer-resource-group-only-filter-empty-partial-capture-copy";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

export function ResourcesExplorerResourceGroupOnlyFilterEmptyPartialHonesty(): React.JSX.Element | null {
  const { productLine } = useProductLine();

  if (!isSecureNowProductLine(productLine)) {
    return null;
  }

  return (
    <SecureNowInfraPartialCaptureStrip
      testId="infra-resource-explorer-resource-group-only-filter-empty-partial-capture"
      middleLine={RESOURCE_EXPLORER_RESOURCE_GROUP_ONLY_FILTER_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="infra-resource-explorer-resource-group-only-filter-empty-partial-capture-cloud"
      extractUploadTestId="infra-resource-explorer-resource-group-only-filter-empty-partial-capture-extract"
    />
  );
}
