import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const PILOT_POLICY_PACK_EXPANDED_PARAM = "pilotPolicyPackExpanded";

export function parsePilotPolicyPackExpandedFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function pilotPolicyPackExpandedHrefFromSearch(
  currentSearch: string,
  expanded: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, expanded, pathname, PILOT_POLICY_PACK_EXPANDED_PARAM);
}
