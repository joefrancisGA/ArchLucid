/** Canonical operator sponsor dashboard (portfolio overview). */
export const SPONSOR_DASHBOARD_HREF = "/architecture/sponsor-dashboard" as const;

/** In-page anchor for merged workspace-health KPIs (formerly `/governance/dashboard`). */
export const SPONSOR_DASHBOARD_WORKSPACE_HEALTH_SECTION_ID = "workspace-health" as const;

/** Governance nav and deep links target this hash on the sponsor dashboard. */
export const SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF =
  `${SPONSOR_DASHBOARD_HREF}#${SPONSOR_DASHBOARD_WORKSPACE_HEALTH_SECTION_ID}` as const;

export function isSponsorDashboardPath(pathname: string): boolean {
  return pathname === SPONSOR_DASHBOARD_HREF || pathname.startsWith(`${SPONSOR_DASHBOARD_HREF}/`);
}

/** @deprecated Prefer `SPONSOR_DASHBOARD_HREF`. */
export const EXECUTIVE_DASHBOARD_HREF = SPONSOR_DASHBOARD_HREF;

/** @deprecated Prefer `SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF`. */
export const EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_HREF = SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF;

/** @deprecated Prefer `SPONSOR_DASHBOARD_WORKSPACE_HEALTH_SECTION_ID`. */
export const EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_SECTION_ID = SPONSOR_DASHBOARD_WORKSPACE_HEALTH_SECTION_ID;

/** @deprecated Prefer `isSponsorDashboardPath`. */
export const isExecutiveDashboardPath = isSponsorDashboardPath;
