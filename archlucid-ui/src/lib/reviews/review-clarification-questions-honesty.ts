import type { ReviewClarificationQuestion } from "@/lib/review-clarification-questions-types";

export const CLARIFICATION_QUESTIONS_NOT_STORED_LABEL =
  "Clarification questions were not stored." as const;

export const CLARIFICATION_QUESTIONS_STORED_EMPTY_LABEL =
  "No clarification questions are stored." as const;

export function describeClarificationQuestionsLoadState(
  clarificationQuestions: readonly ReviewClarificationQuestion[] | undefined,
): string | null {
  if (clarificationQuestions === undefined) {
    return CLARIFICATION_QUESTIONS_NOT_STORED_LABEL;
  }

  if (clarificationQuestions.length === 0) {
    return CLARIFICATION_QUESTIONS_STORED_EMPTY_LABEL;
  }

  return null;
}
