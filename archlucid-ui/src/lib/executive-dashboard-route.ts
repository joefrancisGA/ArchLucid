/** Canonical operator executive dashboard (portfolio overview). */
export const EXECUTIVE_DASHBOARD_HREF = "/architecture/executive-dashboard" as const;

export function isExecutiveDashboardPath(pathname: string): boolean {
  return pathname === EXECUTIVE_DASHBOARD_HREF || pathname.startsWith(`${EXECUTIVE_DASHBOARD_HREF}/`);
}
