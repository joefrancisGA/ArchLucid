"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { SIGNED_RECORDS_DATE_RANGE_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/governance/signed-records-date-range-filter-empty-partial-capture-copy";

export function SignedRecordsDateRangeFilterEmptyPartialHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="signed-records-date-range-filter-empty-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={SIGNED_RECORDS_DATE_RANGE_FILTER_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="signed-records-date-range-filter-empty-partial-cloud"
      extractUploadTestId="signed-records-date-range-filter-empty-partial-extract"
    />
  );
}