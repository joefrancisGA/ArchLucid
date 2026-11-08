import type { TransparencyTrail } from "@/types/feasibility-verdict";

export const SKIPPED_MUST_QUESTION_KEY_NOT_STORED_LABEL = "Question key was not stored." as const;

/** Returns skipped MUST question keys in trail order (includes rows with blank keys). */
export function listSkippedMustQuestionKeys(
  trail: TransparencyTrail | null | undefined,
): readonly string[] {
  if (trail === null || trail === undefined) {
    return [];
  }

  return trail.skipped
    .filter((entry) => entry.tier === "Must")
    .map((entry) => {
      const questionKey = entry.questionKey.trim();

      return questionKey.length > 0 ? questionKey : SKIPPED_MUST_QUESTION_KEY_NOT_STORED_LABEL;
    });
}
