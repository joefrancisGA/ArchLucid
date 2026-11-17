import { SECOND_REVIEW_RERUN_QUERY_PARAM } from "@/lib/second-review-prior-package";

export type ResolveClarificationFollowUpHrefInput = {
  readonly runId: string;
  readonly priorRunId: string | null;
  readonly questionId?: string;
};

export const CLARIFICATION_FOLLOW_UP_REVIEW_ID_NOT_STORED =
  "Review id was not stored, so this question cannot open a follow-up review." as const;

export function resolveClarificationFollowUpHref(input: ResolveClarificationFollowUpHrefInput): string | null {
  const runId = input.runId.trim();

  if (runId.length === 0) {
    return null;
  }

  const params = new URLSearchParams({
    path: "quick-review",
    [SECOND_REVIEW_RERUN_QUERY_PARAM]: runId,
    cloneFromRunId: runId,
    intent: "revised-clone",
  });

  if (input.priorRunId !== null && input.priorRunId.trim().length > 0) {
    params.set("priorRunId", input.priorRunId.trim());
  }

  if (input.questionId !== undefined && input.questionId.trim().length > 0) {
    params.set("clarificationQuestionId", input.questionId.trim());
  }

  return `/architecture/reviews/new?${params.toString()}`;
}
