"use client";

import { SecureNowInfraPartialCaptureStrip } from "@/components/product-line/SecureNowInfraPartialCaptureStrip";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { POLICY_PACK_DETAIL_PARTIAL_ASSIGNMENT_LINE } from "@/lib/policy/policy-pack-detail-partial-assignment-copy";

export function PolicyPackDetailPartialCaptureStrip(): React.JSX.Element | null {
  const { productLine } = useProductLine();

  if (!isSecureNowProductLine(productLine)) {
    return null;
  }

  return (
    <SecureNowInfraPartialCaptureStrip
      testId="policy-pack-detail-partial-capture"
      middleLine={POLICY_PACK_DETAIL_PARTIAL_ASSIGNMENT_LINE}
      cloudConnectionsTestId="policy-pack-detail-partial-capture-cloud"
      extractUploadTestId="policy-pack-detail-partial-capture-extract"
    />
  );
}