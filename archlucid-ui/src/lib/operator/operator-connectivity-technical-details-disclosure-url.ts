import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const OPERATOR_CONNECTIVITY_TECHNICAL_DETAILS_OPEN_PARAM = "operatorConnectivityTechnicalDetailsOpen";

export function parseOperatorConnectivityTechnicalDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function operatorConnectivityTechnicalDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, OPERATOR_CONNECTIVITY_TECHNICAL_DETAILS_OPEN_PARAM);
}
