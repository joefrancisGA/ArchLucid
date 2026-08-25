import type { LearningPlanListItemResponse } from "@/types/learning";

/** Most recently created improvement plan in the list. */
export function resolveContinueLastPlanningPlan(
  plans: readonly LearningPlanListItemResponse[],
): LearningPlanListItemResponse | null {
  if (plans.length === 0) {
    return null;
  }

  return [...plans].sort((left, right) => right.createdUtc.localeCompare(left.createdUtc))[0] ?? null;
}
