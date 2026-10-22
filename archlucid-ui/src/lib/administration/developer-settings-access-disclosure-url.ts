import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const DEVELOPER_SETTINGS_ACCESS_OPEN_PARAM = "developerSettingsAccessOpen";

export function parseDeveloperSettingsAccessOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function developerSettingsAccessDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, DEVELOPER_SETTINGS_ACCESS_OPEN_PARAM);
}
