import type { TransparencyTrail } from "@/types/feasibility-verdict";

/** Returns skipped MUST question keys in trail order. */
export function listSkippedMustQuestionKeys(
  trail: TransparencyTrail | null | undefined,
): readonly string[] {
  if (trail === null || trail === undefined) {
    return [];
  }

  return trail.skipped
    .filter((entry) => entry.tier === "Must")
    .map((entry) => entry.questionKey.trim())
    .filter((questionKey) => questionKey.length > 0);
}
