import { SECOND_REVIEW_RERUN_QUERY_PARAM } from "@/lib/second-review-prior-package";

export type ResolveClarificationFollowUpHrefInput = {
  readonly runId: string;
  readonly priorRunId: string | null;
  readonly questionId?: string;
};

export function resolveClarificationFollowUpHref(input: ResolveClarificationFollowUpHrefInput): string {
  const params = new URLSearchParams({
    path: "quick-review",
    [SECOND_REVIEW_RERUN_QUERY_PARAM]: input.runId.trim(),
    cloneFromRunId: input.runId.trim(),
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
