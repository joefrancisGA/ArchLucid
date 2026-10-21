import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const AUDIT_BUYER_UTILITIES_DETAILS_OPEN_PARAM = "auditBuyerUtilitiesDetailsOpen";

export function parseAuditBuyerUtilitiesDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function auditBuyerUtilitiesDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, AUDIT_BUYER_UTILITIES_DETAILS_OPEN_PARAM);
}
