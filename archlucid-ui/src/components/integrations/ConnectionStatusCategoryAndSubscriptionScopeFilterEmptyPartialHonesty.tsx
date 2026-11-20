"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { CONNECTION_STATUS_CATEGORY_AND_SUBSCRIPTION_SCOPE_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/integrations/connection-status-category-and-subscription-scope-filter-empty-partial-capture-copy";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

export function ConnectionStatusCategoryAndSubscriptionScopeFilterEmptyPartialHonesty(): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const partialCapture = useLatestSnapshotCaptureIsPartial(isSecureNowProductLine(productLine));
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!isSecureNowProductLine(productLine) || !partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="connection-status-category-and-subscription-scope-filter-empty-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={CONNECTION_STATUS_CATEGORY_AND_SUBSCRIPTION_SCOPE_FILTER_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="connection-status-category-and-subscription-scope-filter-empty-partial-capture-cloud"
      extractUploadTestId="connection-status-category-and-subscription-scope-filter-empty-partial-capture-extract"
    />
  );
}
