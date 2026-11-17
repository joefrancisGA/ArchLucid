"use client";

import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { COMPARE_FINDING_CORRELATION_PARTIAL_EMPTY_LINE } from "@/lib/compare-finding-correlation-partial-empty-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function CompareFindingCorrelationPartialEmptyHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);

  if (!partialCapture) {
    return null;
  }

  return (
    <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)} data-testid="compare-correlation-empty-partial-capture">
      {COMPARE_FINDING_CORRELATION_PARTIAL_EMPTY_LINE}
    </p>
  );
}