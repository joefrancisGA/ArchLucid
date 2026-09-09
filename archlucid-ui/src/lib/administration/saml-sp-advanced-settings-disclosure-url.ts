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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(SAML_SP_ADVANCED_SETTINGS_OPEN_PARAM);
  } else {
    params.set(SAML_SP_ADVANCED_SETTINGS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
