import { INTEGRATIONS_TEAMS_PATH } from "@/lib/integrations-nav-paths";

export const TEAMS_REMOVE_CONFIRM_PARAM = "teamsRemoveConfirm";

export function parseTeamsRemoveConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function teamsNotificationsRemoveConfirmHrefFromSearch(
  currentSearch: string,
  confirmOpen: boolean,
  pathname: string = INTEGRATIONS_TEAMS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!confirmOpen) {
    params.delete(TEAMS_REMOVE_CONFIRM_PARAM);
  } else {
    params.set(TEAMS_REMOVE_CONFIRM_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
