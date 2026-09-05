import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";

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
  const params = new URLSearchParams(currentSearch);

  if (!inviteOpen) {
    params.delete(SETTINGS_USERS_INVITE_PARAM);
  } else {
    params.set(SETTINGS_USERS_INVITE_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
