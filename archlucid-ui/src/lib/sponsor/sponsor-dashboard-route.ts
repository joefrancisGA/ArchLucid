import { WORKSPACE_HEALTH_PATH } from "@/lib/workspace-health-route";

/** Canonical operator sponsor dashboard (portfolio overview). */
export const SPONSOR_DASHBOARD_HREF = "/architecture/sponsor-dashboard" as const;

/**
 * @deprecated Legacy sponsor-dashboard fragment bookmark — use {@link WORKSPACE_HEALTH_PATH}.
 * Kept so existing imports resolve to the standalone page.
 */
export const SPONSOR_DASHBOARD_WORKSPACE_HEALTH_SECTION_ID = "workspace-health" as const;

/** @deprecated Use {@link WORKSPACE_HEALTH_PATH} — workspace health is no longer on the sponsor dashboard. */
export const SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF = WORKSPACE_HEALTH_PATH;

export function isSponsorDashboardPath(pathname: string): boolean {
  return pathname === SPONSOR_DASHBOARD_HREF || pathname.startsWith(`${SPONSOR_DASHBOARD_HREF}/`);
}
