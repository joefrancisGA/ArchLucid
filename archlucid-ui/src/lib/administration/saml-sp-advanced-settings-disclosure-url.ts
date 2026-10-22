import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const SAML_SP_ADVANCED_SETTINGS_OPEN_PARAM = "samlSpAdvancedSettingsOpen";

export function parseSamlSpAdvancedSettingsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function samlSpAdvancedSettingsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SAML_SP_ADVANCED_SETTINGS_OPEN_PARAM);
}
