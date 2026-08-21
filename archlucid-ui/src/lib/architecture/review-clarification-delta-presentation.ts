import type { ReviewClarificationDelta } from "@/lib/review-clarification-questions-types";

export type ClarificationDeltaPresentation = {
  readonly resolvedByAssertionCount: number;
  readonly resolvedByEvidenceCount: number;
  readonly stillOpenCount: number;
  readonly priorRunId: string;
};

export function buildClarificationDeltaPresentation(
  delta: ReviewClarificationDelta | null,
): ClarificationDeltaPresentation | null {
  if (delta === null) {
    return null;
  }

  return {
    priorRunId: delta.priorRunId,
    resolvedByAssertionCount: delta.resolvedByAssertionQuestionIds.length,
    resolvedByEvidenceCount: delta.resolvedByEvidenceQuestionIds.length,
    stillOpenCount: delta.stillOpenQuestionIds.length,
  };
}
