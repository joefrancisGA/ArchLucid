import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";

export const SETTINGS_INVITES_SHOW_RESOLVED_PARAM = "settingsInvitesShowResolved";

export function parseSettingsInvitesShowResolvedFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function settingsInvitesShowResolvedHrefFromSearch(
  currentSearch: string,
  showResolved: boolean,
  pathname: string = SETTINGS_USERS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!showResolved) {
    params.delete(SETTINGS_INVITES_SHOW_RESOLVED_PARAM);
  } else {
    params.set(SETTINGS_INVITES_SHOW_RESOLVED_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
