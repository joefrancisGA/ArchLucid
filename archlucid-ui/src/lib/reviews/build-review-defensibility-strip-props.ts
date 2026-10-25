import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

import type { ReviewDefensibilityStripProps } from "@/components/reviews/ReviewDefensibilityStrip";
import { feasibilityVerdictKindLabel } from "@/lib/feasibility-verdict-display";
import { countSkippedMustQuestions } from "@/lib/review-quality/count-skipped-must-questions";

function trailArrayCount(value: readonly unknown[] | undefined, trailPresent: boolean): number | null {
  if (!trailPresent) {
    return null;
  }

  if (value === undefined) {
    return null;
  }

  return value.length;
}

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
  const trailPresent = trail !== null && trail !== undefined;

  return {
    assertedCount: trailArrayCount(trail?.asserted, trailPresent),
    inferredCount: trailArrayCount(trail?.inferred, trailPresent),
    skippedCount: trailPresent ? countSkippedMustQuestions(trail) : null,
    criticAbsent,
    verdictKind: feasibilityVerdictKindLabel(feasibilityVerdict.kind),
  };
}
