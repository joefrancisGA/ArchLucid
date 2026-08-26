/** Canonical Improvement planning (Insights); formerly `/planning` and `/insights/planning`. */
export const PLANNING_PATH = "/insights/improvement-planning" as const;

/** Plan detail under Improvement planning. */
export const PLANNING_PLAN_DETAIL_PATH_PREFIX = `${PLANNING_PATH}/plans` as const;

/** Retired top-level path — hard-retired bookmark (404). */
export const LEGACY_PLANNING_PATH = "/planning" as const;

/** Retired plan-detail prefix — hard-retired bookmark (404). */
export const LEGACY_PLANNING_PLAN_DETAIL_PATH_PREFIX = "/planning/plans" as const;

/** Retired Insights hub path — hard-retired bookmark (404); canonical is {@link PLANNING_PATH}. */
export const LEGACY_INSIGHTS_PLANNING_PATH = "/insights/planning" as const;

/** Retired Insights plan-detail prefix — hard-retired bookmark (404). */
export const LEGACY_INSIGHTS_PLANNING_PLAN_DETAIL_PATH_PREFIX = "/insights/planning/plans" as const;

export function isPlanningPath(pathname: string): boolean {
  return pathname === PLANNING_PATH || pathname.startsWith(`${PLANNING_PATH}/`);
}

/** Builds `/insights/improvement-planning/plans/{planId}` with encoding. */
export function planningPlanDetailPath(planId: string): string {
  return `${PLANNING_PLAN_DETAIL_PATH_PREFIX}/${encodeURIComponent(planId.trim())}`;
}

/** Plan detail deep link preserving optional review scope. */
export function planningPlanDetailHref(planId: string, runId?: string | null): string {
  const base = planningPlanDetailPath(planId);
  const trimmed = (runId ?? "").trim();

  if (trimmed.length === 0) {
    return base;
  }

  return `${base}?runId=${encodeURIComponent(trimmed)}`;
}
