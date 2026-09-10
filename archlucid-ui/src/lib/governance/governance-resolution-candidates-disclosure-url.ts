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
  const params = new URLSearchParams(currentSearch);
  const trimmed = (itemKey ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(GOVERNANCE_RESOLUTION_CANDIDATES_ITEM_KEY_PARAM);
  } else {
    params.set(GOVERNANCE_RESOLUTION_CANDIDATES_ITEM_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
