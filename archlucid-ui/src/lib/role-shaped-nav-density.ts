import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";

/** Default sidebar density personas — capabilities-driven, not CSS-only hide (TB-2139). */
export type RoleNavDensityPersona = "architect" | "governance" | "admin";

/** Stable localStorage key for the evaluator “show full nav” escape hatch. */
export const ROLE_NAV_DENSITY_SHOW_FULL_NAV_STORAGE_KEY = "archlucid_role_nav_density_show_full_nav";

/**
 * Nav group ids visible by default for each persona. Groups omitted here stay reachable via
 * “Show all destinations” without elevating privileges.
 */
export const DEFAULT_NAV_GROUP_IDS_BY_ROLE_NAV_DENSITY_PERSONA: Readonly<
  Record<RoleNavDensityPersona, readonly string[]>
> = {
  architect: ["pilot", "operate-analysis"],
  governance: ["pilot", "operate-governance"],
  admin: ["pilot", "operator-admin"],
};

const ADMIN_ROLE_CLAIMS = new Set(["admin", "workspaceadmin", "projectadmin"]);
const GOVERNANCE_ROLE_CLAIMS = new Set(["auditor"]);

/**
 * Maps JWT / Entra role claims to a default nav-density persona. Admin wins over Auditor over architect.
 * Does not change API authorization — density only.
 */
export function resolveRoleNavDensityPersona(
  roleClaimValues: readonly string[],
): RoleNavDensityPersona {
  const normalized = roleClaimValues.map((role) => role.trim().toLowerCase());

  for (const role of normalized) {
    if (ADMIN_ROLE_CLAIMS.has(role)) {
      return "admin";
    }
  }

  for (const role of normalized) {
    if (GOVERNANCE_ROLE_CLAIMS.has(role)) {
      return "governance";
    }
  }

  return "architect";
}

export function defaultNavGroupIdsForRoleNavDensityPersona(
  persona: RoleNavDensityPersona,
): ReadonlySet<string> {
  return new Set(DEFAULT_NAV_GROUP_IDS_BY_ROLE_NAV_DENSITY_PERSONA[persona]);
}

/** Filters shell nav rows to the persona default set unless the user expanded to full nav. */
export function filterNavGroupsByRoleDensity(
  rows: readonly NavGroupWithVisibleLinks[],
  persona: RoleNavDensityPersona,
  showFullNav: boolean,
): NavGroupWithVisibleLinks[] {
  if (showFullNav) {
    return [...rows];
  }

  const allowed = defaultNavGroupIdsForRoleNavDensityPersona(persona);

  return rows.filter((row) => allowed.has(row.group.id));
}

/** Counts nav groups hidden by the persona default density (for sidebar “N more” / show-all affordance). */
export function countNavGroupsHiddenByRoleDensity(
  rows: readonly NavGroupWithVisibleLinks[],
  persona: RoleNavDensityPersona,
  showFullNav: boolean,
): number {
  if (showFullNav) {
    return 0;
  }

  const allowed = defaultNavGroupIdsForRoleNavDensityPersona(persona);

  return rows.filter((row) => !allowed.has(row.group.id)).length;
}

export function visibleOperatorShellHrefSetFromNavRows(
  rows: readonly NavGroupWithVisibleLinks[],
): Set<string> {
  const hrefs = new Set<string>();

  for (const row of rows) {
    for (const link of row.visibleLinks) {
      hrefs.add(link.href);
    }
  }

  return hrefs;
}
