import type { DraftElicitationQuestion } from "@/types/draft-intake";

export type GuidedIntakeClarificationProgressInput = {
  /** MUST keys captured at admission on the draft document (stable total baseline). */
  readonly admittedRequiredMustQuestionKeys: readonly string[];
  /** Pending-only keys from the latest question-selection refresh. */
  readonly pendingSelectionRequiredKeys: readonly string[];
  readonly allQuestions: readonly DraftElicitationQuestion[];
  /** Pending clarifications still shown in the UI (excludes locally saved rows). */
  readonly activePendingCount: number;
};

export type GuidedIntakeClarificationProgress = {
  readonly totalRequired: number;
  readonly handledCount: number;
};

/**
 * Derives clarification progress for guided intake. Selection APIs only return unanswered
 * MUST keys, so the admitted document baseline and MUST-tier catalog prevent "0 of 0" when
 * every clarification is already answered or skipped.
 */
export function resolveGuidedIntakeClarificationProgress(
  input: GuidedIntakeClarificationProgressInput,
): GuidedIntakeClarificationProgress {
  const mustTierCount = input.allQuestions.filter((question) => question.tier === "Must").length;

  const totalRequired =
    input.admittedRequiredMustQuestionKeys.length > 0
      ? input.admittedRequiredMustQuestionKeys.length
      : Math.max(input.pendingSelectionRequiredKeys.length, mustTierCount, input.activePendingCount);

  const handledCount = Math.max(0, Math.min(totalRequired, totalRequired - input.activePendingCount));

  return { totalRequired, handledCount };
}

/** Keeps the longest non-empty admitted MUST key list (admission baseline must not shrink on refresh). */
export function mergeAdmittedRequiredMustQuestionKeys(
  currentKeys: readonly string[],
  documentKeys: readonly string[] | undefined,
): string[] {
  if (documentKeys === undefined || documentKeys.length === 0) {
    return [...currentKeys];
  }

  if (documentKeys.length >= currentKeys.length) {
    return [...documentKeys];
  }

  return [...currentKeys];
}
