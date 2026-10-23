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
      assertedCount: null,
      inferredCount: null,
      skippedCount: null,
      criticAbsent: true,
      verdictKind: null,
    };
  }

  const trail = feasibilityVerdict.transparencyTrail;
  const trailStored = trail !== null && trail !== undefined;

  return {
    assertedCount: trailStored ? trail.asserted.length : null,
    inferredCount: trailStored ? trail.inferred.length : null,
    skippedCount: trailStored ? countSkippedMustQuestions(trail) : null,
    criticAbsent,
    verdictKind: feasibilityVerdictKindLabel(feasibilityVerdict.kind),
  };
}
