import type { ClosedLoopReasoningResult } from "@/lib/architecture/architecture-intelligence-api";

/** Mirrors `ArchitectureFramingMustGate.PublishBlockReason` on the API. */
export const ARCHITECTURE_FRAMING_INCOMPLETE_PUBLISH_BLOCK_REASON =
  "L0 framing incomplete: review cannot be sealed until MUST questions are answered.";

/** Operator-facing guidance when refine returns open framing questions. */
export const ARCHITECTURE_FRAMING_INCOMPLETE_GUIDANCE_MESSAGE =
  "Answer the framing questions below to continue with architecture refinement";

export const ARCHITECTURE_FRAMING_SUGGEST_FROM_OVERVIEW_BUTTON = "Suggest from overview";

export const ARCHITECTURE_FRAMING_SKIP_QUESTION_BUTTON = "Skip this question";

export const ARCHITECTURE_FRAMING_SKIPPED_STATUS_LABEL = "Skipped";

export const ARCHITECTURE_FRAMING_SUGGEST_EMPTY_MESSAGE =
  "No framing answers could be inferred from the overview yet. Add more detail or answer manually.";

export const ARCHITECTURE_FRAMING_SUGGEST_SUCCESS_MESSAGE = (count: number): string =>
  count === 1
    ? "Suggested 1 framing answer from the overview. Review and edit before re-running refine."
    : `Suggested ${count} framing answers from the overview. Review and edit before re-running refine.`;

export const ARCHITECTURE_FRAMING_SKIPPED_WARNING_TITLE = "Some framing questions are skipped";

export const ARCHITECTURE_FRAMING_SKIPPED_WARNING_DESCRIPTION =
  "AI refinement usually produces stronger results when framing questions are fully answered. You can proceed anyway — skipped questions will not be sent to the reasoning run.";

export const ARCHITECTURE_FRAMING_SKIPPED_WARNING_PROCEED_LABEL = "Proceed anyway";

export const ARCHITECTURE_FRAMING_SKIPPED_WARNING_GO_BACK_LABEL = "Go back";

export type ArchitectureIntelligenceFramingQuestion = {
  readonly questionId: string;
  readonly prompt: string;
  readonly isAnswered?: boolean;
  readonly confirmedAnswer?: string | null;
  readonly source?: string;
};

export function collectOpenFramingInterviewQuestions(
  result: ClosedLoopReasoningResult,
): readonly ArchitectureIntelligenceFramingQuestion[] {
  const framing = result.interview?.framingQuestions ?? [];
  const evidence = result.interview?.evidenceDrivenQuestions ?? [];

  return [...framing, ...evidence].filter((question) => question.isAnswered !== true);
}

export function isFramingIncompletePublishBlock(result: ClosedLoopReasoningResult): boolean {
  return (result.publishBlockReasons ?? []).some(
    (reason) =>
      reason === ARCHITECTURE_FRAMING_INCOMPLETE_PUBLISH_BLOCK_REASON ||
      reason.includes("L0 framing incomplete"),
  );
}

export function resolvePublishBlockedAlertMessage(result: ClosedLoopReasoningResult): string {
  if (
    collectOpenFramingInterviewQuestions(result).length > 0 &&
    (result.publishBlocked === true || isFramingIncompletePublishBlock(result))
  ) {
    return ARCHITECTURE_FRAMING_INCOMPLETE_GUIDANCE_MESSAGE;
  }

  const reasons = (result.publishBlockReasons ?? []).join(" · ");

  return reasons.length > 0
    ? `Publish blocked: ${reasons}`
    : "Publish blocked: trust gate rejected publishable output.";
}

export function mergeFramingAnswerDefaults(
  questions: readonly ArchitectureIntelligenceFramingQuestion[],
  currentAnswers: Readonly<Record<string, string>>,
): Record<string, string> {
  const merged: Record<string, string> = { ...currentAnswers };

  for (const question of questions) {
    if ((merged[question.questionId]?.trim() ?? "").length > 0) {
      continue;
    }

    const confirmed = question.confirmedAnswer?.trim() ?? "";

    if (confirmed.length > 0) {
      merged[question.questionId] = confirmed;
    }
  }

  return merged;
}

export function isFramingQuestionSkipped(
  questionId: string,
  skippedQuestionIds: ReadonlySet<string>,
): boolean {
  return skippedQuestionIds.has(questionId);
}

export function framingInterviewAnswersComplete(
  questions: readonly ArchitectureIntelligenceFramingQuestion[],
  answers: Readonly<Record<string, string>>,
): boolean {
  return framingInterviewReadyToSubmit(questions, answers, new Set());
}

export function framingInterviewReadyToSubmit(
  questions: readonly ArchitectureIntelligenceFramingQuestion[],
  answers: Readonly<Record<string, string>>,
  skippedQuestionIds: ReadonlySet<string>,
): boolean {
  if (questions.length === 0) {
    return false;
  }

  return questions.every((question) => {
    if (skippedQuestionIds.has(question.questionId)) {
      return true;
    }

    return (answers[question.questionId]?.trim() ?? "").length > 0;
  });
}

export function hasSkippedFramingQuestions(skippedQuestionIds: ReadonlySet<string>): boolean {
  return skippedQuestionIds.size > 0;
}

export function buildFramingAnswersPayload(
  questions: readonly ArchitectureIntelligenceFramingQuestion[],
  answers: Readonly<Record<string, string>>,
  skippedQuestionIds: ReadonlySet<string> = new Set(),
): Record<string, string> {
  const payload: Record<string, string> = {};

  for (const question of questions) {
    if (skippedQuestionIds.has(question.questionId)) {
      continue;
    }

    const trimmed = answers[question.questionId]?.trim() ?? "";

    if (trimmed.length > 0) {
      payload[question.questionId] = trimmed;
    }
  }

  return payload;
}
