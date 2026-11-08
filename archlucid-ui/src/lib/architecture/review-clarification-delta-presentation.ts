import type { ReviewClarificationDelta } from "@/lib/review-clarification-questions-types";

export type ReviewClarificationDeltaPresentation = {
  readonly resolvedByEvidenceCount: number;
  readonly resolvedByAssertionCount: number;
  readonly stillOpenCount: number;
  readonly summary: string | null;
  readonly cappedListDisclaimer: string | null;
};

export const REVIEW_CLARIFICATION_DELTA_STRIP_LIST_CAP = 20;

export function formatReviewClarificationDeltaStripCappedListDisclaimer(totalStoredQuestionIds: number): string | null {
  if (totalStoredQuestionIds <= REVIEW_CLARIFICATION_DELTA_STRIP_LIST_CAP) {
    return null;
  }

  const omitted = totalStoredQuestionIds - REVIEW_CLARIFICATION_DELTA_STRIP_LIST_CAP;

  return `${omitted} additional stored question id${omitted === 1 ? "" : "s"} are not listed in this delta strip.`;
}

export function buildReviewClarificationDeltaPresentation(
  delta: ReviewClarificationDelta | null | undefined,
  options?: { readonly priorRunId?: string | null },
): ReviewClarificationDeltaPresentation {
  if (delta === null || delta === undefined) {
    const priorRunId = options?.priorRunId?.trim() ?? "";

    return {
      resolvedByEvidenceCount: 0,
      resolvedByAssertionCount: 0,
      stillOpenCount: 0,
      summary:
        priorRunId.length > 0
          ? "Clarification delta from the prior review was not stored."
          : null,
      cappedListDisclaimer: null,
    };
  }

  const resolvedByEvidenceCount = delta.resolvedByEvidenceQuestionIds.length;
  const resolvedByAssertionCount = delta.resolvedByAssertionQuestionIds.length;
  const stillOpenCount = delta.stillOpenQuestionIds.length;
  const totalStoredQuestionIds = resolvedByEvidenceCount + resolvedByAssertionCount + stillOpenCount;
  const cappedListDisclaimer = formatReviewClarificationDeltaStripCappedListDisclaimer(totalStoredQuestionIds);

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
        ? "1 question still open from the prior review"
        : `${stillOpenCount} questions still open from the prior review`,
    );
  }

  return {
    resolvedByEvidenceCount,
    resolvedByAssertionCount,
    stillOpenCount,
    summary:
      parts.length > 0
        ? parts.join(" · ")
        : "Clarification carry-forward was stored with no resolved or open questions.",
    cappedListDisclaimer,
  };
}
