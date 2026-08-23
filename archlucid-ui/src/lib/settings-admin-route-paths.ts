import { DIGESTS_SCHEDULE_TAB_PATH } from "@/lib/digests-route-paths";
import { pathMatchesRoutePrefix } from "@/lib/governance/governance-route-paths";

export { DIGESTS_SCHEDULE_TAB_PATH };

/** Canonical Administration hub (searchable settings index). */
export const SETTINGS_ROOT_PATH = "/administration" as const;

/** Legacy hub segment  —  permanent redirect to {@link SETTINGS_ROOT_PATH}. */
export const LEGACY_ADMINISTRATION_SETTINGS_ROOT_PATH = "/administration/settings" as const;

/** Retired Settings hub root  —  no App Router page and no next.config redirect. */
export const LEGACY_SETTINGS_ROOT_PATH = "/settings" as const;

/** Canonical tenant-administration URLs (TB-406). */
export const SETTINGS_USERS_PATH = `${SETTINGS_ROOT_PATH}/users`;

export const SETTINGS_USERS_ROLES_TAB_PATH = `${SETTINGS_USERS_PATH}?tab=roles`;

export const SETTINGS_USERS_USERS_TAB_PATH = `${SETTINGS_USERS_PATH}?tab=users`;

export const SETTINGS_USERS_KEYS_TAB_PATH = `${SETTINGS_USERS_PATH}?tab=keys`;

/** Legacy roles index  —  retired bookmark; canonical is {@link SETTINGS_USERS_ROLES_TAB_PATH}. */
export const LEGACY_SETTINGS_ROLES_PATH = "/settings/roles";

export type SettingsUsersTabId = "users" | "roles" | "keys";

/**
 * Unified notification preference hub (TB-2203) - links digests, alerts, Teams, Slack.
 *
 * Stays under `/administration` even though the account menu lists it: the page itself writes nothing
 * personal, and every channel it launches (digest schedules, alert rules, Teams, Slack) is
 * workspace-scoped. Settings that write only the caller's own record live under `ACCOUNT_ROOT_PATH`
 * instead — see `account-route-paths.ts`.
 */
export const SETTINGS_NOTIFICATIONS_PATH = `${SETTINGS_ROOT_PATH}/notifications`;

/**
 * Retired personal-settings bookmarks — moved to `/account/preferences` and `/account/security`.
 * Deliberately no App Router page and no next.config redirect: these were authenticated app pages,
 * so the owner accepted breaking the bookmark rather than carrying a permanent shim.
 */
export const RETIRED_ADMINISTRATION_PREFERENCES_PATH = `${SETTINGS_ROOT_PATH}/preferences` as const;

export const RETIRED_ADMINISTRATION_ACCOUNT_SECURITY_PATH =
  `${SETTINGS_ROOT_PATH}/account-security` as const;

export const SETTINGS_SECURITY_TRUST_PATH = `${SETTINGS_ROOT_PATH}/security-trust`;

export const SETTINGS_SUPPORT_PATH = `${SETTINGS_ROOT_PATH}/support`;

/** Canonical workspace settings (trial, cost, scope, quality gates). */
export const SETTINGS_WORKSPACE_SETTINGS_PATH = `${SETTINGS_ROOT_PATH}/workspace-settings` as const;

export const SETTINGS_WORKSPACE_SETTINGS_RECYCLE_BIN_PATH =
  `${SETTINGS_WORKSPACE_SETTINGS_PATH}/recycle-bin` as const;

/** @deprecated Legacy bookmark — use {@link SETTINGS_WORKSPACE_SETTINGS_PATH}. */
export const LEGACY_SETTINGS_TENANT_PATH = `${SETTINGS_ROOT_PATH}/tenant` as const;

/** @deprecated Legacy bookmark — use {@link SETTINGS_WORKSPACE_SETTINGS_RECYCLE_BIN_PATH}. */
export const LEGACY_SETTINGS_TENANT_RECYCLE_BIN_PATH = `${LEGACY_SETTINGS_TENANT_PATH}/recycle-bin` as const;

/** @deprecated Use {@link SETTINGS_WORKSPACE_SETTINGS_PATH}. */
export const SETTINGS_TENANT_PATH = LEGACY_SETTINGS_TENANT_PATH;

export const SETTINGS_AUTH_DOMAINS_PATH = `${SETTINGS_ROOT_PATH}/auth-domains` as const;

export function pathMatchesSettingsRoot(pathname: string): boolean {
  return (
    pathname === SETTINGS_ROOT_PATH
    || pathname === LEGACY_ADMINISTRATION_SETTINGS_ROOT_PATH
    || pathMatchesRoutePrefix(pathname, LEGACY_SETTINGS_ROOT_PATH)
  );
}

/** Exact Settings hub root only — not `/administration/*` children (TB-1201 help registration). */
export function pathIsSettingsHubRoot(pathname: string): boolean {
  return pathname === SETTINGS_ROOT_PATH || pathname === LEGACY_ADMINISTRATION_SETTINGS_ROOT_PATH;
}

/** Legacy browser paths  —  permanent redirects to canonical (TB-406). */
export const LEGACY_ADMIN_USERS_PATH = "/admin/users";

export const LEGACY_WORKSPACE_SECURITY_TRUST_PATH = "/workspace/security-trust";

export const LEGACY_ADMIN_SUPPORT_PATH = "/admin/support";

export function pathMatchesSettingsUsers(pathname: string): boolean {
  return (
    pathMatchesRoutePrefix(pathname, SETTINGS_USERS_PATH)
    || pathMatchesRoutePrefix(pathname, `${LEGACY_ADMINISTRATION_SETTINGS_ROOT_PATH}/users`)
    || pathMatchesRoutePrefix(pathname, LEGACY_ADMIN_USERS_PATH)
    || pathMatchesRoutePrefix(pathname, LEGACY_SETTINGS_ROLES_PATH)
  );
}

export function pathMatchesLegacySettingsRoles(pathname: string): boolean {
  return pathMatchesRoutePrefix(pathname, LEGACY_SETTINGS_ROLES_PATH);
}

/** Canonical users hub pathname for tab navigation  —  upgrades legacy rewrite paths. */
export function settingsUsersNavigationPathname(pathname: string): string {
  const normalized = normalizeSettingsAdminPathname(pathname);

  if (normalized === LEGACY_SETTINGS_ROLES_PATH) {
    return SETTINGS_USERS_PATH;
  }

  return normalized;
}

/** Resolves the active users hub tab from pathname + `?tab=` (legacy roles path defaults to Roles). */
export function settingsUsersTabFromLocation(
  pathname: string,
  tabParam: string | null,
  canManageApiKeys: boolean,
): SettingsUsersTabId {
  const normalized = normalizeSettingsAdminPathname(pathname);

  if (normalized === LEGACY_SETTINGS_ROLES_PATH) {
    return "roles";
  }

  return sanitizeSettingsUsersTabParam(tabParam, canManageApiKeys);
}

export function sanitizeSettingsUsersTabParam(
  raw: string | null,
  canManageApiKeys: boolean,
): SettingsUsersTabId {
  if (raw === "roles") {
    return "roles";
  }

  if (raw === "keys" && canManageApiKeys) {
    return "keys";
  }

  return "users";
}

function normalizeSettingsAdminPathname(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function pathMatchesSettingsSecurityTrust(pathname: string): boolean {
  return (
    pathMatchesRoutePrefix(pathname, SETTINGS_SECURITY_TRUST_PATH)
    || pathMatchesRoutePrefix(pathname, `${LEGACY_ADMINISTRATION_SETTINGS_ROOT_PATH}/security-trust`)
    || pathMatchesRoutePrefix(pathname, LEGACY_WORKSPACE_SECURITY_TRUST_PATH)
  );
}

export function pathMatchesSettingsSupport(pathname: string): boolean {
  return (
    pathMatchesRoutePrefix(pathname, SETTINGS_SUPPORT_PATH)
    || pathMatchesRoutePrefix(pathname, `${LEGACY_ADMINISTRATION_SETTINGS_ROOT_PATH}/support`)
    || pathMatchesRoutePrefix(pathname, LEGACY_ADMIN_SUPPORT_PATH)
  );
}

export function pathMatchesSettingsWorkspaceSettings(pathname: string): boolean {
  return (
    pathMatchesRoutePrefix(pathname, SETTINGS_WORKSPACE_SETTINGS_PATH)
    || pathMatchesRoutePrefix(pathname, LEGACY_SETTINGS_TENANT_PATH)
  );
}
