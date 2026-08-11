/** Canonical operator executive dashboard (portfolio overview). */
export const EXECUTIVE_DASHBOARD_HREF = "/architecture/executive-dashboard" as const;

/** In-page anchor for merged workspace-health KPIs (formerly `/governance/dashboard`). */
export const EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_SECTION_ID = "workspace-health" as const;

/** Governance nav and deep links target this hash on the executive dashboard. */
export const EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_HREF =
  `${EXECUTIVE_DASHBOARD_HREF}#${EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_SECTION_ID}` as const;

export function isExecutiveDashboardPath(pathname: string): boolean {
  return pathname === EXECUTIVE_DASHBOARD_HREF || pathname.startsWith(`${EXECUTIVE_DASHBOARD_HREF}/`);
}
