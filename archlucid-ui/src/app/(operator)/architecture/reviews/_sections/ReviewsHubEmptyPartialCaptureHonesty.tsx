"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { REVIEWS_HUB_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/architecture/reviews-hub-empty-partial-capture-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function ReviewsHubEmptyPartialCaptureHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <div className={cn("mt-2", OPERATOR_TYPOGRAPHY.helper)}>
      <SecureNowPartialCaptureRecoveryParagraph
        testId="reviews-hub-recent-empty-partial-capture"
        partialCaptureSnapshotId={partialCaptureSnapshotId}
        returnPath={partialCaptureReturnPath}
        middleLine={REVIEWS_HUB_EMPTY_PARTIAL_CAPTURE_LINE}
        cloudConnectionsTestId="reviews-hub-recent-empty-partial-capture-cloud"
        extractUploadTestId="reviews-hub-recent-empty-partial-capture-extract"
      />
    </div>
  );
}