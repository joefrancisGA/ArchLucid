import { SETTINGS_WORKSPACE_SETTINGS_PATH } from "@/lib/settings-admin-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const PROJECT_DELETE_CONFIRM_ID_PARAM = "deleteProjectId";

export function parseProjectDeleteConfirmIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function projectDeleteConfirmHrefFromSearch(
  currentSearch: string,
  projectId: string | null,
  pathname: string = SETTINGS_WORKSPACE_SETTINGS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (projectId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(PROJECT_DELETE_CONFIRM_ID_PARAM);
    } else {
      params.set(PROJECT_DELETE_CONFIRM_ID_PARAM, trimmed);
    }
    },
  });
}
