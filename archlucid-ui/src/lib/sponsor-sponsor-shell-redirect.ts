import {
  SPONSOR_DASHBOARD_HREF,
  isSponsorDashboardPath,
} from "@/lib/sponsor/sponsor-dashboard-route";

const EXECUTE_LEVEL_ROLE_KEYS = new Set([
  "admin",
  "workspaceadmin",
  "platformoperator",
  "operator",
  "architect",
  "reviewer",
  "projectadmin",
]);

function normalizedRoleKeys(roleClaimValues: readonly string[]): readonly string[] {
  return roleClaimValues
    .map((role) => role.trim().toLowerCase())
    .filter((role) => role.length > 0);
}

/** True when the principal carries Sponsor without any Execute-class app role. */
export function isSponsorOnlyPrincipal(roleClaimValues: readonly string[]): boolean {
  const roles = normalizedRoleKeys(roleClaimValues);
  const hasSponsor = roles.includes("sponsor");

  if (!hasSponsor) {
    return false;
  }

  return !roles.some((role) => EXECUTE_LEVEL_ROLE_KEYS.has(role));
}

export type SponsorRedirectInput = {
  readonly pathname: string;
  readonly search?: string | null;
};

/**
 * Maps unsupported operator-shell paths to sponsor-safe landing routes.
 * Returns null when no redirect is required.
 */
export function resolveSponsorRedirectTarget(input: SponsorRedirectInput): string | null {
  const pathname = input.pathname.trim().length > 0 ? input.pathname : "/";
  const search = (input.search ?? "").trim();
  const querySuffix = search.length > 0 ? (search.startsWith("?") ? search : `?${search}`) : "";

  if (pathname.startsWith("/sponsor")) {
    return null;
  }

  if (isSponsorDashboardPath(pathname)) {
    return null;
  }

  if (pathname === "/") {
    return null;
  }

  if (pathname.startsWith("/auth/")) {
    return null;
  }

  if (pathname === "/403") {
    return null;
  }

  if (pathname.startsWith("/marketing") || pathname.startsWith("/showcase")) {
    return null;
  }

  if (pathname === "/architecture/reviews" || pathname.startsWith("/architecture/reviews/")) {
    return null;
  }

  return `${SPONSOR_DASHBOARD_HREF}${querySuffix}`;
}
