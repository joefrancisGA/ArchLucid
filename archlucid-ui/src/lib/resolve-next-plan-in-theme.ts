import { parseIsoUtcMs } from "@/lib/format-iso-utc";
import type { LearningPlanListItemResponse } from "@/types/learning";

function creationSortTime(createdUtc: string): number {
  const time = parseIsoUtcMs(createdUtc);
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

/** Next improvement plan in the same theme after the current plan id. */
export function resolveNextPlanInTheme(
  plans: readonly LearningPlanListItemResponse[],
  currentPlanId: string,
  themeId: string,
): LearningPlanListItemResponse | null {
  const normalizedPlanId = currentPlanId.trim();
  const normalizedThemeId = themeId.trim();

  if (normalizedPlanId.length === 0 || normalizedThemeId.length === 0) {
    return null;
  }

  const themePlans = plans
    .filter((plan) => plan.themeId === normalizedThemeId)
    .slice()
    .sort((left, right) => {
      const priorityDelta = right.priorityScore - left.priorityScore;

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return creationSortTime(left.createdUtc) - creationSortTime(right.createdUtc);
    });

  const currentIndex = themePlans.findIndex((plan) => plan.planId === normalizedPlanId);

  if (currentIndex < 0) {
    return null;
  }

  return themePlans[currentIndex + 1] ?? null;
}
