/** Canonical Workspace health page (Insights nav). */
export const WORKSPACE_HEALTH_PATH = "/insights/workspace-health" as const;

/** Retired standalone path — redirects to {@link WORKSPACE_HEALTH_PATH}. */
export const LEGACY_GOVERNANCE_DASHBOARD_PATH = "/governance/dashboard" as const;

/** Legacy sponsor-dashboard fragment bookmark — client redirect only. */
export const LEGACY_SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HASH = "workspace-health" as const;

/** Hash fragment form of {@link LEGACY_SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HASH}. */
export const LEGACY_SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HASH_FRAGMENT =
  `#${LEGACY_SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HASH}` as const;

export function isWorkspaceHealthPath(pathname: string): boolean {
  return pathname === WORKSPACE_HEALTH_PATH || pathname.startsWith(`${WORKSPACE_HEALTH_PATH}/`);
}

/** Canonical workspace health href — preserves legacy bookmark query strings. */
export function buildWorkspaceHealthRedirectHref(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, entry);
      }
    } else {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return query.length === 0 ? WORKSPACE_HEALTH_PATH : `${WORKSPACE_HEALTH_PATH}?${query}`;
}
