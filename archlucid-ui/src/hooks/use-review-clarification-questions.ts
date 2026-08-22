"use client";

import { useQuery } from "@tanstack/react-query";

import { getReviewClarificationQuestions } from "@/lib/api/review-clarification-questions-api";
import { isBrowser } from "@/lib/api/http";
import type { ReviewClarificationQuestionsResponse } from "@/lib/review-clarification-questions-types";

export type UseReviewClarificationQuestionsOptions = {
  readonly runId: string;
  readonly priorRunId?: string | null;
  readonly enabled?: boolean;
};

export function reviewClarificationQuestionsQueryKey(
  runId: string,
  priorRunId: string | null | undefined,
): readonly ["review", "clarification-questions", string, string | null] {
  return ["review", "clarification-questions", runId, priorRunId ?? null] as const;
}

export function useReviewClarificationQuestions(
  options: UseReviewClarificationQuestionsOptions,
): {
  readonly data: ReviewClarificationQuestionsResponse | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly refetch: () => void;
} {
  const enabled = (options.enabled ?? true) && options.runId.trim().length > 0 && isBrowser();

  const query = useQuery<ReviewClarificationQuestionsResponse>({
    queryKey: reviewClarificationQuestionsQueryKey(options.runId, options.priorRunId),
    queryFn: () => getReviewClarificationQuestions(options.runId, options.priorRunId),
    enabled,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
