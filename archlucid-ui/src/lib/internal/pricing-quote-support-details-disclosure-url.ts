import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const PRICING_QUOTE_SUPPORT_DETAILS_OPEN_PARAM = "pricingQuoteSupportDetailsOpen";

export function parsePricingQuoteSupportDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function pricingQuoteSupportDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, PRICING_QUOTE_SUPPORT_DETAILS_OPEN_PARAM);
}
