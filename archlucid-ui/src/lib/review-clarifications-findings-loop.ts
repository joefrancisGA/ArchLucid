import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";

export type ClarificationsFindingsLoopInput = {
  readonly openClarificationGapCount: number;
  readonly findingsCount: number;
};

export type ClarificationsFindingsLoopRecommendation = {
  readonly nextTabId: ReviewDetailTabId;
  readonly sentence: string;
};

/** TB-2367 — clarifications → findings loop guidance for create-home review workspace. */
export function resolveClarificationsFindingsLoopNext(
  input: ClarificationsFindingsLoopInput,
): ClarificationsFindingsLoopRecommendation | null {
  if (input.openClarificationGapCount > 0) {
    const gapLabel =
      input.openClarificationGapCount === 1
        ? "One clarifying question is still open"
        : `${input.openClarificationGapCount} clarifying questions are still open`;

    return {
      nextTabId: "decisions-remediation",
      sentence: `${gapLabel} — answer them before triaging findings.`,
    };
  }

  if (input.findingsCount > 0) {
    const findingsLabel =
      input.findingsCount === 1
        ? "the one assessment finding"
        : `${input.findingsCount} assessment findings`;

    return {
      nextTabId: "findings",
      sentence: `Clarifications are clear — triage ${findingsLabel} next.`,
    };
  }

  return null;
}
