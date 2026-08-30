import {
  LEGACY_SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HASH,
  WORKSPACE_HEALTH_PATH,
} from "@/lib/workspace-health-route";

/** Canonical operator sponsor dashboard (portfolio overview). */
export const SPONSOR_DASHBOARD_HREF = "/architecture/sponsor-dashboard" as const;

/** Legacy sponsor-dashboard in-page section id — still used for hash redirect matching. */
export const SPONSOR_DASHBOARD_WORKSPACE_HEALTH_SECTION_ID = LEGACY_SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HASH;

/** Legacy sponsor-dashboard fragment bookmark — client redirect only. */
export const LEGACY_SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF =
  `${SPONSOR_DASHBOARD_HREF}#${SPONSOR_DASHBOARD_WORKSPACE_HEALTH_SECTION_ID}` as const;

/** @deprecated Use {@link WORKSPACE_HEALTH_PATH} — workspace health is no longer on the sponsor dashboard. */
export const SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF = WORKSPACE_HEALTH_PATH;

export function isSponsorDashboardPath(pathname: string): boolean {
  return pathname === SPONSOR_DASHBOARD_HREF || pathname.startsWith(`${SPONSOR_DASHBOARD_HREF}/`);
}
