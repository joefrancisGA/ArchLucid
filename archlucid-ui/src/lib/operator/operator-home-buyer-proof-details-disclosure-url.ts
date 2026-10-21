import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const OPERATOR_HOME_BUYER_PROOF_DETAILS_OPEN_PARAM = "operatorHomeBuyerProofDetailsOpen";

export function parseOperatorHomeBuyerProofDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function operatorHomeBuyerProofDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, OPERATOR_HOME_BUYER_PROOF_DETAILS_OPEN_PARAM);
}
