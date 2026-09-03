import type { ArchLucidAppRole } from "@/lib/current-principal";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";

export const SETTINGS_ROLES_MEMBER_ROLE_PARAM = "role";
export const SETTINGS_ROLES_MEMBER_STATUS_PARAM = "status";

export const SETTINGS_ROLES_MEMBER_ROLE_OPTIONS: readonly ArchLucidAppRole[] = [
  "Admin",
  "Operator",
  "Reader",
  "Auditor",
];

export const SETTINGS_ROLES_MEMBER_STATUS_OPTIONS = ["user", "api_key"] as const;

export type SettingsRolesMemberStatusFilter = (typeof SETTINGS_ROLES_MEMBER_STATUS_OPTIONS)[number];

const SETTINGS_ROLES_MEMBER_ROLE_IDS = new Set<string>(SETTINGS_ROLES_MEMBER_ROLE_OPTIONS);
const SETTINGS_ROLES_MEMBER_STATUS_IDS = new Set<string>(SETTINGS_ROLES_MEMBER_STATUS_OPTIONS);

export function parseSettingsRolesMemberRoleFromSearch(raw: string | null | undefined): ArchLucidAppRole | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!SETTINGS_ROLES_MEMBER_ROLE_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as ArchLucidAppRole;
}

export function parseSettingsRolesMemberStatusFromSearch(
  raw: string | null | undefined,
): SettingsRolesMemberStatusFilter | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!SETTINGS_ROLES_MEMBER_STATUS_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as SettingsRolesMemberStatusFilter;
}

export function settingsRolesMemberRoleHrefFromSearch(
  currentSearch: string,
  role: ArchLucidAppRole | null,
  pathname: string = SETTINGS_USERS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (role === null) {
    params.delete(SETTINGS_ROLES_MEMBER_ROLE_PARAM);
  } else {
    params.set(SETTINGS_ROLES_MEMBER_ROLE_PARAM, role);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function settingsRolesMemberStatusHrefFromSearch(
  currentSearch: string,
  status: SettingsRolesMemberStatusFilter | null,
  pathname: string = SETTINGS_USERS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (status === null) {
    params.delete(SETTINGS_ROLES_MEMBER_STATUS_PARAM);
  } else {
    params.set(SETTINGS_ROLES_MEMBER_STATUS_PARAM, status);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
