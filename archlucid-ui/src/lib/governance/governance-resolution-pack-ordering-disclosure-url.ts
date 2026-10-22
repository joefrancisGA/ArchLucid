import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const GOVERNANCE_RESOLUTION_PACK_ORDERING_OPEN_PARAM = "governanceResolutionPackOrderingOpen";

export function parseGovernanceResolutionPackOrderingOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function governanceResolutionPackOrderingDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, GOVERNANCE_RESOLUTION_PACK_ORDERING_OPEN_PARAM);
}
