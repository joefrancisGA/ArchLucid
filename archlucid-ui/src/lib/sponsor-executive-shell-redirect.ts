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

export type SponsorExecutiveRedirectInput = {
  readonly pathname: string;
  readonly search?: string | null;
};

/**
 * Maps operator-shell paths to executive equivalents for Sponsor-only principals.
 * Returns null when no redirect is required.
 */
export function resolveSponsorExecutiveRedirectTarget(input: SponsorExecutiveRedirectInput): string | null {
  const pathname = input.pathname.trim().length > 0 ? input.pathname : "/";
  const search = (input.search ?? "").trim();
  const querySuffix = search.length > 0 ? (search.startsWith("?") ? search : `?${search}`) : "";

  if (pathname.startsWith("/executive")) {
    return null;
  }

  // Executive dashboard consolidation (TB-608) — /dashboard renders the same
  // ExecutiveRoiDashboardPageView as the retired /executive/dashboard, under full
  // operator-shell chrome; Sponsor-only principals may view it without being bounced.
  if (pathname === "/dashboard") {
    return null;
  }

  // The executive shell's own "Architect workspace" handoff link (ExecutiveShellFrame)
  // points at "/" so Sponsor-only principals can see the same view architects do; without
  // this exemption that link was a dead end, immediately bouncing them back out (TB-608).
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

  if (pathname === "/reviews" || pathname.startsWith("/reviews/")) {
    return `/executive${pathname}${querySuffix}`;
  }

  return `/executive/reviews${querySuffix}`;
}
