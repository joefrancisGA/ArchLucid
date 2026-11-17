import type { ReviewClarificationQuestion } from "@/lib/review-clarification-questions-types";
import type { ReviewClarificationSeverity } from "@/lib/review-clarification-questions-types";

export const CLARIFICATION_QUESTIONS_NOT_STORED_LABEL =
  "Clarification questions were not stored." as const;

export const CLARIFICATION_QUESTIONS_NOT_LOADED_LABEL =
  "Clarification questions were not loaded." as const;

export const CLARIFICATION_QUESTIONS_DERIVED_EMPTY_LABEL =
  "No clarification questions were derived." as const;

/** @deprecated Use {@link CLARIFICATION_QUESTIONS_DERIVED_EMPTY_LABEL} for successful empty API responses. */
export const CLARIFICATION_QUESTIONS_STORED_EMPTY_LABEL = CLARIFICATION_QUESTIONS_DERIVED_EMPTY_LABEL;

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
  options?: { readonly loading?: boolean },
): string | null {
  if (options?.loading === true) {
    return CLARIFICATION_QUESTIONS_NOT_LOADED_LABEL;
  }

  if (clarificationQuestions === undefined) {
    return CLARIFICATION_QUESTIONS_NOT_STORED_LABEL;
  }

  if (clarificationQuestions.length === 0) {
    return CLARIFICATION_QUESTIONS_DERIVED_EMPTY_LABEL;
  }

  return null;
}

export const CLARIFICATION_DERIVED_QUESTION_COUNT_NOT_STORED_LABEL =
  "Derived question count was not stored." as const;

export function formatClarificationDerivedQuestionPreviewCapLine(input: {
  readonly listedCount: number;
  readonly totalDerivedCount: number | null | undefined;
}): string | null {
  if (input.totalDerivedCount === null || input.totalDerivedCount === undefined) {
    return CLARIFICATION_DERIVED_QUESTION_COUNT_NOT_STORED_LABEL;
  }

  const omitted = input.totalDerivedCount - input.listedCount;

  if (omitted <= 0) {
    return null;
  }

  return `${omitted} additional derived clarification question${omitted === 1 ? "" : "s"} ${omitted === 1 ? "was" : "were"} not listed.`;
}

export function formatClarificationQuestionSeverityLabel(
  severity: ReviewClarificationSeverity | null | undefined,
): string {
  if (severity === null || severity === undefined) {
    return "Question severity was not stored.";
  }

  const trimmed = `${severity}`.trim();

  if (trimmed.length === 0) {
    return "Question severity was stored empty.";
  }

  return trimmed;
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
