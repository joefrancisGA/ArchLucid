import type { TransparencyTrail } from "@/types/feasibility-verdict";

/** Count skipped MUST questions in a transparency trail for finalize gating (PT-17). */
export function countSkippedMustQuestions(trail: TransparencyTrail | null | undefined): number {
  if (trail === null || trail === undefined) {
    return 0;
  }

  let count = 0;

  for (const skipped of trail.skipped) {
    if (skipped.tier !== "Must") {
      continue;
    }

    const questionKey = skipped.questionKey.trim();

    if (questionKey.length === 0) {
      continue;
    }

    count += 1;
  }

  return count;
}
