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

export type BuildReviewDefensibilityStripInput = {
  readonly pipelineInFlight: boolean;
  readonly criticAbsent: boolean;
};

export function buildReviewDefensibilityStripProps(
  feasibilityVerdict: ManifestFeasibilityVerdict | null | undefined,
  input: BuildReviewDefensibilityStripInput,
): ReviewDefensibilityStripProps | null {
  const { pipelineInFlight, criticAbsent } = input;

  if (feasibilityVerdict === null || feasibilityVerdict === undefined) {
    if (!pipelineInFlight && !criticAbsent) {
      return null;
    }

    return {
      assertedCount: null,
      inferredCount: null,
      skippedCount: null,
      pipelineInFlight,
      criticAbsent,
      verdictKind: null,
    };
  }

  const trail = feasibilityVerdict.transparencyTrail;
  const trailPresent = trail !== null && trail !== undefined;

  return {
    assertedCount: trailArrayCount(trail?.asserted, trailPresent),
    inferredCount: trailArrayCount(trail?.inferred, trailPresent),
    skippedCount: trailPresent ? countSkippedMustQuestions(trail) : null,
    pipelineInFlight,
    criticAbsent,
    verdictKind: feasibilityVerdictKindLabel(feasibilityVerdict.kind),
  };
}
