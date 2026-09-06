export const PRICING_QUOTE_SLA_SETTINGS_OPEN_PARAM = "pricingQuoteSlaSettingsOpen";

export function parsePricingQuoteSlaSettingsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function pricingQuoteSlaSettingsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(PRICING_QUOTE_SLA_SETTINGS_OPEN_PARAM);
  } else {
    params.set(PRICING_QUOTE_SLA_SETTINGS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
