"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { SIGNED_RECORDS_UNSCOPED_LIST_PARTIAL_CAPTURE_LINE } from "@/lib/governance/signed-records-unscoped-list-partial-capture-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function SignedRecordsUnscopedListPartialHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <div className={cn("mt-3", OPERATOR_TYPOGRAPHY.helper)}>
      <SecureNowPartialCaptureRecoveryParagraph
        testId="signed-records-unscoped-list-partial-capture"
        partialCaptureSnapshotId={partialCaptureSnapshotId}
        returnPath={partialCaptureReturnPath}
        middleLine={SIGNED_RECORDS_UNSCOPED_LIST_PARTIAL_CAPTURE_LINE}
        cloudConnectionsTestId="signed-records-unscoped-list-partial-capture-cloud"
        extractUploadTestId="signed-records-unscoped-list-partial-capture-extract"
      />
    </div>
  );
}