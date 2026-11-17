"use client";

import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { COMPARE_INSUFFICIENT_FINALIZED_PARTIAL_CAPTURE_LINE } from "@/lib/architecture/compare-insufficient-finalized-partial-capture-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function CompareInsufficientFinalizedPartialCaptureHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);

  if (!partialCapture) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="compare-insufficient-finalized-partial-capture"
    >
      {COMPARE_INSUFFICIENT_FINALIZED_PARTIAL_CAPTURE_LINE}
    </p>
  );
}