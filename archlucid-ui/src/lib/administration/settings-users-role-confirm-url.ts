import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const SETTINGS_USERS_ROLE_CONFIRM_PRINCIPAL_ID_PARAM = "roleConfirmPrincipalId";
export const SETTINGS_USERS_ROLE_CONFIRM_NEXT_ROLE_PARAM = "roleConfirmNextRole";

export type SettingsUsersRoleConfirmUrlState = {
  readonly principalId: string | null;
  readonly nextRole: string | null;
};

export function parseSettingsUsersRoleConfirmPrincipalIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseSettingsUsersRoleConfirmNextRoleFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function settingsUsersRoleConfirmHrefFromSearch(
  currentSearch: string,
  state: SettingsUsersRoleConfirmUrlState,
  pathname: string = SETTINGS_USERS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const principalId = (state.principalId ?? "").trim();
    const nextRole = (state.nextRole ?? "").trim();

    if (principalId.length === 0 || nextRole.length === 0) {
      params.delete(SETTINGS_USERS_ROLE_CONFIRM_PRINCIPAL_ID_PARAM);
      params.delete(SETTINGS_USERS_ROLE_CONFIRM_NEXT_ROLE_PARAM);
    } else {
      params.set(SETTINGS_USERS_ROLE_CONFIRM_PRINCIPAL_ID_PARAM, principalId);
      params.set(SETTINGS_USERS_ROLE_CONFIRM_NEXT_ROLE_PARAM, nextRole);
    }
    },
  });
}
