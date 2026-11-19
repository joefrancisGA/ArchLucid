"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { REVIEWS_HUB_ORPHAN_CANDIDATES_AND_SEARCH_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/reviews/reviews-hub-orphan-candidates-and-search-filter-empty-partial-capture-copy";

export function RunsListOrphanCandidatesAndSearchFilterEmptyPartialHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(false);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="reviews-hub-orphan-candidates-and-search-filter-empty-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={REVIEWS_HUB_ORPHAN_CANDIDATES_AND_SEARCH_FILTER_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="reviews-hub-orphan-candidates-and-search-filter-empty-partial-cloud"
      extractUploadTestId="reviews-hub-orphan-candidates-and-search-filter-empty-partial-extract"
    />
  );
}
