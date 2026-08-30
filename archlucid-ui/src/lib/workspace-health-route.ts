/** Canonical Workspace health page (Insights nav). */
export const WORKSPACE_HEALTH_PATH = "/insights/workspace-health" as const;

/** Retired standalone path — redirects to {@link WORKSPACE_HEALTH_PATH}. */
export const LEGACY_GOVERNANCE_DASHBOARD_PATH = "/governance/dashboard" as const;

/** Legacy sponsor-dashboard fragment bookmark — client redirect only. */
export const LEGACY_SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HASH = "workspace-health" as const;

export function isWorkspaceHealthPath(pathname: string): boolean {
  return pathname === WORKSPACE_HEALTH_PATH || pathname.startsWith(`${WORKSPACE_HEALTH_PATH}/`);
}
