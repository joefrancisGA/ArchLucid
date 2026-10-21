import { ADMINISTRATION_SETTINGS_PATH } from "@/lib/administration/settings-master-search-url";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const SETTINGS_MASTER_ADVANCED_OPEN_PARAM = "settingsMasterAdvancedOpen";

export function parseSettingsMasterAdvancedOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function settingsMasterAdvancedHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string = ADMINISTRATION_SETTINGS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!open) {
      params.delete(SETTINGS_MASTER_ADVANCED_OPEN_PARAM);
    } else {
      params.set(SETTINGS_MASTER_ADVANCED_OPEN_PARAM, "1");
    }
    },
  });
}
