"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { NEEDS_ATTENTION_INBOX_ALL_CLEAR_PARTIAL_CAPTURE_LINE } from "@/lib/operator/needs-attention-inbox-all-clear-partial-capture-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type NeedsAttentionInboxAllClearPartialHonestyProps = {
  readonly allCountsZero: boolean;
};

export function NeedsAttentionInboxAllClearPartialHonesty(
  props: NeedsAttentionInboxAllClearPartialHonestyProps,
): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!props.allCountsZero || !partialCapture) {
    return null;
  }

  return (
    <div className={cn("mt-4", OPERATOR_TYPOGRAPHY.helper)}>
      <SecureNowPartialCaptureRecoveryParagraph
        testId="needs-attention-inbox-all-clear-partial-capture"
        partialCaptureSnapshotId={partialCaptureSnapshotId}
        returnPath={partialCaptureReturnPath}
        middleLine={NEEDS_ATTENTION_INBOX_ALL_CLEAR_PARTIAL_CAPTURE_LINE}
        cloudConnectionsTestId="needs-attention-inbox-all-clear-partial-capture-cloud"
        extractUploadTestId="needs-attention-inbox-all-clear-partial-capture-extract"
      />
    </div>
  );
}