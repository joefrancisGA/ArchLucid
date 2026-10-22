import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const GOVERNANCE_RESOLUTION_CANDIDATES_ITEM_KEY_PARAM = "governanceResolutionCandidatesItemKey";

export function parseGovernanceResolutionCandidatesItemKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function governanceResolutionCandidatesDisclosureHrefFromSearch(
  currentSearch: string,
  itemKey: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (itemKey ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(GOVERNANCE_RESOLUTION_CANDIDATES_ITEM_KEY_PARAM);
    } else {
      params.set(GOVERNANCE_RESOLUTION_CANDIDATES_ITEM_KEY_PARAM, trimmed);
    }
    },
  });
}
