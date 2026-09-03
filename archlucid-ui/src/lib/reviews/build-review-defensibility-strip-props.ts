import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

import type { ReviewDefensibilityStripProps } from "@/components/reviews/ReviewDefensibilityStrip";
import { feasibilityVerdictKindLabel } from "@/lib/feasibility-verdict-display";
import { countSkippedMustQuestions } from "@/lib/review-quality/count-skipped-must-questions";

export function buildReviewDefensibilityStripProps(
  feasibilityVerdict: ManifestFeasibilityVerdict | null | undefined,
  criticAbsent: boolean,
): ReviewDefensibilityStripProps | null {
  if (feasibilityVerdict === null || feasibilityVerdict === undefined) {
    if (!criticAbsent) {
      return null;
    }

    return {
      assertedCount: 0,
      inferredCount: 0,
      skippedCount: 0,
      criticAbsent: true,
      verdictKind: null,
    };
  }

  const trail = feasibilityVerdict.transparencyTrail;

  return {
    assertedCount: trail?.asserted.length ?? 0,
    inferredCount: trail?.inferred.length ?? 0,
    skippedCount: countSkippedMustQuestions(trail),
    criticAbsent,
    verdictKind: feasibilityVerdictKindLabel(feasibilityVerdict.kind),
  };
}
