"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { REVIEWS_HUB_PACKAGE_SCOPE_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/reviews/reviews-hub-package-scope-filter-empty-partial-capture-copy";

export function RunsListPackageScopeFilterEmptyPartialHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(false);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="reviews-hub-package-scope-filter-empty-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={REVIEWS_HUB_PACKAGE_SCOPE_FILTER_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="reviews-hub-package-scope-filter-empty-partial-cloud"
      extractUploadTestId="reviews-hub-package-scope-filter-empty-partial-extract"
    />
  );
}
