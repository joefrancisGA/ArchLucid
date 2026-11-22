"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { DIGESTS_BROWSE_SUBSCRIPTION_LIST_ONLY_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/digests/digests-browse-subscription-list-only-empty-partial-capture-copy";

export function DigestsBrowseSubscriptionListOnlyEmptyPartialHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="digests-browse-subscription-list-only-empty-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={DIGESTS_BROWSE_SUBSCRIPTION_LIST_ONLY_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="digests-browse-subscription-list-only-empty-partial-capture-cloud"
      extractUploadTestId="digests-browse-subscription-list-only-empty-partial-extract"
    />
  );
}
