import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, PRICING_QUOTE_SLA_SETTINGS_OPEN_PARAM);
}
