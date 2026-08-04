/** Canonical Improvement planning (Insights); formerly `/planning`. */
export const PLANNING_PATH = "/insights/planning" as const;

/** Plan detail under Improvement planning. */
export const PLANNING_PLAN_DETAIL_PATH_PREFIX = `${PLANNING_PATH}/plans` as const;

/** Retired top-level path — hard-retired bookmark (404). */
export const LEGACY_PLANNING_PATH = "/planning" as const;

/** Retired plan-detail prefix — hard-retired bookmark (404). */
export const LEGACY_PLANNING_PLAN_DETAIL_PATH_PREFIX = "/planning/plans" as const;

export function isPlanningPath(pathname: string): boolean {
  return pathname === PLANNING_PATH || pathname.startsWith(`${PLANNING_PATH}/`);
}

/** Builds `/insights/planning/plans/{planId}` with encoding. */
export function planningPlanDetailPath(planId: string): string {
  return `${PLANNING_PLAN_DETAIL_PATH_PREFIX}/${encodeURIComponent(planId.trim())}`;
}
