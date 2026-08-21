import type { ReviewClarificationDelta } from "@/lib/review-clarification-questions-types";

export type ReviewClarificationDeltaPresentation = {
  readonly resolvedByEvidenceCount: number;
  readonly resolvedByAssertionCount: number;
  readonly stillOpenCount: number;
  readonly summary: string | null;
};

export function buildReviewClarificationDeltaPresentation(
  delta: ReviewClarificationDelta | null | undefined,
): ReviewClarificationDeltaPresentation {
  if (delta === null || delta === undefined) {
    return {
      resolvedByEvidenceCount: 0,
      resolvedByAssertionCount: 0,
      stillOpenCount: 0,
      summary: null,
    };
  }

  const resolvedByEvidenceCount = delta.resolvedByEvidenceQuestionIds.length;
  const resolvedByAssertionCount = delta.resolvedByAssertionQuestionIds.length;
  const stillOpenCount = delta.stillOpenQuestionIds.length;

  const parts: string[] = [];

  if (resolvedByAssertionCount > 0) {
    parts.push(
      resolvedByAssertionCount === 1
        ? "1 question resolved by your answers"
        : `${resolvedByAssertionCount} questions resolved by your answers`,
    );
  }

  if (resolvedByEvidenceCount > 0) {
    parts.push(
      resolvedByEvidenceCount === 1
        ? "1 question resolved by new evidence"
        : `${resolvedByEvidenceCount} questions resolved by new evidence`,
    );
  }

  if (stillOpenCount > 0) {
    parts.push(
      stillOpenCount === 1
        ? "1 question still open from the prior run"
        : `${stillOpenCount} questions still open from the prior run`,
    );
  }

  return {
    resolvedByEvidenceCount,
    resolvedByAssertionCount,
    stillOpenCount,
    summary: parts.length > 0 ? parts.join(" · ") : null,
  };
}
