import { DIGESTS_SCHEDULE_TAB_PATH } from "@/lib/digests-route-paths";
import { pathMatchesRoutePrefix } from "@/lib/governance-route-paths";

export { DIGESTS_SCHEDULE_TAB_PATH };

/** Canonical Administration hub (searchable settings index). */
export const SETTINGS_ROOT_PATH = "/administration" as const;

/** Legacy hub segment â€” permanent redirect to {@link SETTINGS_ROOT_PATH}. */
export const LEGACY_ADMINISTRATION_SETTINGS_ROOT_PATH = "/administration/settings" as const;

/** Retired Settings hub root â€” no App Router page and no next.config redirect. */
export const LEGACY_SETTINGS_ROOT_PATH = "/settings" as const;

/** Canonical tenant-administration URLs (TB-406). */
export const SETTINGS_USERS_PATH = `${SETTINGS_ROOT_PATH}/users`;

export const SETTINGS_USERS_ROLES_TAB_PATH = `${SETTINGS_USERS_PATH}?tab=roles`;

export const SETTINGS_USERS_USERS_TAB_PATH = `${SETTINGS_USERS_PATH}?tab=users`;

export const SETTINGS_USERS_KEYS_TAB_PATH = `${SETTINGS_USERS_PATH}?tab=keys`;

/** Legacy roles index â€” retired bookmark; canonical is {@link SETTINGS_USERS_ROLES_TAB_PATH}. */
export const LEGACY_SETTINGS_ROLES_PATH = "/settings/roles";

export type SettingsUsersTabId = "users" | "roles" | "keys";

/**
 * User-scoped settings. These write only the caller's own record, so they are published from the top-bar
 * account menu (`SELF_SETTINGS_DESTINATIONS`) at every authority rank rather than from the admin hub.
 */
export const SETTINGS_PREFERENCES_PATH = `${SETTINGS_ROOT_PATH}/preferences`;

/** Unified notification preference hub (TB-2203) - links digests, alerts, Teams, Slack. */
export const SETTINGS_NOTIFICATIONS_PATH = `${SETTINGS_ROOT_PATH}/notifications`;

export const SETTINGS_ACCOUNT_SECURITY_PATH = `${SETTINGS_ROOT_PATH}/account-security`;

export const SETTINGS_SECURITY_TRUST_PATH = `${SETTINGS_ROOT_PATH}/security-trust`;

export const SETTINGS_SUPPORT_PATH = `${SETTINGS_ROOT_PATH}/support`;

export const SETTINGS_TENANT_PATH = `${SETTINGS_ROOT_PATH}/tenant`;

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

/** Legacy browser paths â€” permanent redirects to canonical (TB-406). */
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

/** Canonical users hub pathname for tab navigation â€” upgrades legacy rewrite paths. */
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
