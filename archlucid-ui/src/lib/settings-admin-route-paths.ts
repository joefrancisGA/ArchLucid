import { pathMatchesRoutePrefix } from "@/lib/governance-route-paths";

/** Canonical tenant-administration URLs (TB-406). */
export const SETTINGS_USERS_PATH = "/settings/users";

export const SETTINGS_SECURITY_TRUST_PATH = "/settings/security-trust";

export const SETTINGS_SUPPORT_PATH = "/settings/support";

/** Legacy browser paths — permanent redirects to canonical (TB-406). */
export const LEGACY_ADMIN_USERS_PATH = "/admin/users";

export const LEGACY_WORKSPACE_SECURITY_TRUST_PATH = "/workspace/security-trust";

export const LEGACY_ADMIN_SUPPORT_PATH = "/admin/support";

export function pathMatchesSettingsUsers(pathname: string): boolean {
  return (
    pathMatchesRoutePrefix(pathname, SETTINGS_USERS_PATH)
    || pathMatchesRoutePrefix(pathname, LEGACY_ADMIN_USERS_PATH)
  );
}

export function pathMatchesSettingsSecurityTrust(pathname: string): boolean {
  return (
    pathMatchesRoutePrefix(pathname, SETTINGS_SECURITY_TRUST_PATH)
    || pathMatchesRoutePrefix(pathname, LEGACY_WORKSPACE_SECURITY_TRUST_PATH)
  );
}

export function pathMatchesSettingsSupport(pathname: string): boolean {
  return (
    pathMatchesRoutePrefix(pathname, SETTINGS_SUPPORT_PATH)
    || pathMatchesRoutePrefix(pathname, LEGACY_ADMIN_SUPPORT_PATH)
  );
}
