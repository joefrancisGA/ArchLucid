import type { LearningPlanListItemResponse } from "@/types/learning";

import { asNonemptyReadonlyArray } from "@/lib/continue-last-list-guard";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";

/** Most recently created improvement plan in the list. */
export function resolveContinueLastPlanningPlan(
  plans: unknown,
): LearningPlanListItemResponse | null {
  const normalized = asNonemptyReadonlyArray<LearningPlanListItemResponse>(plans);

  if (normalized === null) {
    return null;
  }

  const validPlans = normalized
    .filter((plan) => typeof plan?.createdUtc === "string")
    .map((plan) => ({ plan, createdAtMs: parseIsoUtcMs(plan.createdUtc) }))
    .filter(({ createdAtMs }) => !Number.isNaN(createdAtMs));

  return validPlans.sort((left, right) => right.createdAtMs - left.createdAtMs)[0]?.plan ?? null;
}
