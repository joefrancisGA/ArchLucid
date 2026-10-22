import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const GOVERNANCE_RESOLUTION_RAW_OUTPUT_OPEN_PARAM = "governanceResolutionRawOutputOpen";

export function parseGovernanceResolutionRawOutputOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function governanceResolutionRawOutputDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, GOVERNANCE_RESOLUTION_RAW_OUTPUT_OPEN_PARAM);
}
