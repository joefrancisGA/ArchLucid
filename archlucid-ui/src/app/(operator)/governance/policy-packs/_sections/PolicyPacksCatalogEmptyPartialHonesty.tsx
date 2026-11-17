"use client";

import { SecureNowInfraPartialCaptureStrip } from "@/components/product-line/SecureNowInfraPartialCaptureStrip";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { POLICY_PACKS_CATALOG_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/policy/policy-packs-catalog-empty-partial-capture-copy";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

export function PolicyPacksCatalogEmptyPartialHonesty(): React.JSX.Element | null {
  const { productLine } = useProductLine();

  if (!isSecureNowProductLine(productLine)) {
    return null;
  }

  return (
    <SecureNowInfraPartialCaptureStrip
      testId="policy-packs-catalog-empty-partial-capture"
      middleLine={POLICY_PACKS_CATALOG_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="policy-packs-catalog-empty-partial-capture-cloud"
      extractUploadTestId="policy-packs-catalog-empty-partial-capture-extract"
    />
  );
}