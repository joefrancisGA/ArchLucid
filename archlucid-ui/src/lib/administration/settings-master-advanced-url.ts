import { ADMINISTRATION_SETTINGS_PATH } from "@/lib/administration/settings-master-search-url";

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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(SETTINGS_MASTER_ADVANCED_OPEN_PARAM);
  } else {
    params.set(SETTINGS_MASTER_ADVANCED_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
