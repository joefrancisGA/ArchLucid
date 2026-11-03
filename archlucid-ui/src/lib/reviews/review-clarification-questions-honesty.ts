import type { ReviewClarificationQuestion } from "@/lib/review-clarification-questions-types";

export const CLARIFICATION_QUESTIONS_NOT_STORED_LABEL =
  "Clarification questions were not stored." as const;

export const CLARIFICATION_QUESTIONS_STORED_EMPTY_LABEL =
  "No clarification questions are stored." as const;

export const CLARIFICATION_QUESTION_PROMPT_NOT_STORED_LABEL =
  "Clarification question was not stored." as const;

export const CLARIFICATION_QUESTION_PROMPT_STORED_EMPTY_LABEL =
  "Clarification question was stored empty." as const;

export const CLARIFICATION_GAP_QUESTION_TEXT_STORED_EMPTY_LABEL =
  "Question text was stored empty." as const;

export const CLARIFICATION_ANSWER_NOT_STORED_LABEL = "Answer was not stored." as const;

export const CLARIFICATION_ANSWER_STORED_EMPTY_LABEL = "Answer was stored empty." as const;

export const CLARIFICATION_COMPLETE_SKIPPED_NO_ANSWER_LABEL =
  "Clarification was marked complete without a stored answer." as const;

export function formatClarificationQuestionPromptLabel(prompt: string): string {
  if (prompt.length === 0) {
    return CLARIFICATION_QUESTION_PROMPT_NOT_STORED_LABEL;
  }

  if (prompt.trim().length === 0) {
    return CLARIFICATION_QUESTION_PROMPT_STORED_EMPTY_LABEL;
  }

  return prompt.trim();
}

/** Gap list copy aligns with the clarification answer panel. */
export function formatClarificationGapQuestionPromptLabel(prompt: string): string {
  if (prompt.length === 0) {
    return CLARIFICATION_QUESTION_PROMPT_NOT_STORED_LABEL;
  }

  if (prompt.trim().length === 0) {
    return CLARIFICATION_GAP_QUESTION_TEXT_STORED_EMPTY_LABEL;
  }

  return prompt.trim();
}

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
  if (input.storedAnswer === null || input.storedAnswer === undefined) {
    return CLARIFICATION_ANSWER_NOT_STORED_LABEL;
  }

  const answer = input.storedAnswer.trim();
  const skipped = input.markedSkipped === true;
  const complete = input.markedComplete === true;

  if ((skipped || complete) && answer.length === 0) {
    return CLARIFICATION_COMPLETE_SKIPPED_NO_ANSWER_LABEL;
  }

  if (input.storedAnswer.length === 0) {
    return CLARIFICATION_ANSWER_STORED_EMPTY_LABEL;
  }

  if (answer.length === 0) {
    return CLARIFICATION_ANSWER_STORED_EMPTY_LABEL;
  }

  return null;
}
