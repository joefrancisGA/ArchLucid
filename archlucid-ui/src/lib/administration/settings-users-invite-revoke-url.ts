import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";

export const SETTINGS_USERS_REVOKE_INVITE_ID_PARAM = "revokeInviteId";

export function parseSettingsUsersRevokeInviteIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function settingsUsersInviteRevokeHrefFromSearch(
  currentSearch: string,
  invitationId: string | null,
  pathname: string = SETTINGS_USERS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (invitationId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(SETTINGS_USERS_REVOKE_INVITE_ID_PARAM);
  } else {
    params.set(SETTINGS_USERS_REVOKE_INVITE_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
