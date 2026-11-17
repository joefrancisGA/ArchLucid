"use client";

import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { COMPARE_FINDING_CORRELATION_PARTIAL_RESULTS_LINE } from "@/lib/compare-finding-correlation-partial-results-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function CompareFindingCorrelationPartialResultsHonesty(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);

  if (!partialCapture) {
    return null;
  }

  return (
    <p
      className={cn("m-0 mt-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="compare-correlation-results-partial-capture"
    >
      {COMPARE_FINDING_CORRELATION_PARTIAL_RESULTS_LINE}
    </p>
  );
}