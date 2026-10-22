import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const SETTINGS_USERS_INVITE_PARAM = "invite";

export function parseSettingsUsersInviteOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function settingsUsersInviteHrefFromSearch(
  currentSearch: string,
  inviteOpen: boolean,
  pathname: string = SETTINGS_USERS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!inviteOpen) {
      params.delete(SETTINGS_USERS_INVITE_PARAM);
    } else {
      params.set(SETTINGS_USERS_INVITE_PARAM, "1");
    }
    },
  });
}
