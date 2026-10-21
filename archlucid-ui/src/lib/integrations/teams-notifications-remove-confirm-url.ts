import { INTEGRATIONS_TEAMS_PATH } from "@/lib/integrations-nav-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!confirmOpen) {
      params.delete(TEAMS_REMOVE_CONFIRM_PARAM);
    } else {
      params.set(TEAMS_REMOVE_CONFIRM_PARAM, "1");
    }
    },
  });
}
