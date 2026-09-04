import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";

export const SETTINGS_ROLES_MATRIX_CONFIRM_KIND_PARAM = "rolesMatrixConfirm";
export const SETTINGS_ROLES_MATRIX_CONFIRM_ROLE_NAME_PARAM = "rolesMatrixRoleName";

export const SETTINGS_ROLES_MATRIX_CONFIRM_KINDS = ["save", "create"] as const;

export type SettingsRolesMatrixConfirmKind = (typeof SETTINGS_ROLES_MATRIX_CONFIRM_KINDS)[number];

const SETTINGS_ROLES_MATRIX_CONFIRM_KIND_SET = new Set<string>(SETTINGS_ROLES_MATRIX_CONFIRM_KINDS);

export type SettingsRolesMatrixConfirmUrlState = {
  readonly kind: SettingsRolesMatrixConfirmKind | null;
  readonly roleName: string | null;
};

export function parseSettingsRolesMatrixConfirmKindFromSearch(
  raw: string | null | undefined,
): SettingsRolesMatrixConfirmKind | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!SETTINGS_ROLES_MATRIX_CONFIRM_KIND_SET.has(trimmed)) {
    return null;
  }

  return trimmed as SettingsRolesMatrixConfirmKind;
}

export function parseSettingsRolesMatrixConfirmRoleNameFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function settingsRolesMatrixConfirmHrefFromSearch(
  currentSearch: string,
  state: SettingsRolesMatrixConfirmUrlState,
  pathname: string = SETTINGS_USERS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const roleName = (state.roleName ?? "").trim();

  if (state.kind === null || roleName.length === 0) {
    params.delete(SETTINGS_ROLES_MATRIX_CONFIRM_KIND_PARAM);
    params.delete(SETTINGS_ROLES_MATRIX_CONFIRM_ROLE_NAME_PARAM);
  } else {
    params.set(SETTINGS_ROLES_MATRIX_CONFIRM_KIND_PARAM, state.kind);
    params.set(SETTINGS_ROLES_MATRIX_CONFIRM_ROLE_NAME_PARAM, roleName);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
