import type { ReviewClarificationQuestion } from "@/lib/review-clarification-questions-types";

export const CLARIFICATION_QUESTIONS_NOT_STORED_LABEL =
  "Clarification questions were not stored." as const;

export const CLARIFICATION_QUESTIONS_STORED_EMPTY_LABEL =
  "No clarification questions are stored." as const;

export const CLARIFICATION_COMPLETE_SKIPPED_NO_ANSWER_LABEL =
  "Clarification was marked complete without a stored answer." as const;

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

export function formatGuidedIntakeClarificationAnswerStatus(input: {
  readonly storedAnswer?: string | null;
  readonly markedSkipped?: boolean;
  readonly markedComplete?: boolean;
}): string | null {
  const answer = input.storedAnswer?.trim() ?? "";
  const skipped = input.markedSkipped === true;
  const complete = input.markedComplete === true;

  if ((skipped || complete) && answer.length === 0) {
    return CLARIFICATION_COMPLETE_SKIPPED_NO_ANSWER_LABEL;
  }

  if (answer.length === 0) {
    return "Answer was not stored.";
  }

  return null;
}
