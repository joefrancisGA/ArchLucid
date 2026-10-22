import type { AssertedTrailEntry, TransparencyTrail } from "@/types/feasibility-verdict";

export function listPresenterAssertedAnswerEntries(
  trail: TransparencyTrail | null | undefined,
): readonly AssertedTrailEntry[] {
  if (trail === null || trail === undefined) {
    return [];
  }

  return trail.asserted.filter((entry) => entry.key.startsWith("answer."));
}
