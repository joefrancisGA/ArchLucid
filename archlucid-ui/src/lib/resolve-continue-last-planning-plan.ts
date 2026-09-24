import type { LearningPlanListItemResponse } from "@/types/learning";

import { asNonemptyReadonlyArray } from "@/lib/continue-last-list-guard";

/** Most recently created improvement plan in the list. */
export function resolveContinueLastPlanningPlan(
  plans: unknown,
): LearningPlanListItemResponse | null {
  const normalized = asNonemptyReadonlyArray<LearningPlanListItemResponse>(plans);

  if (normalized === null) {
    return null;
  }

  const validPlans = normalized.filter((plan) => typeof plan?.createdUtc === "string");

  return [...validPlans].sort((left, right) => right.createdUtc.localeCompare(left.createdUtc))[0] ?? null;
}
