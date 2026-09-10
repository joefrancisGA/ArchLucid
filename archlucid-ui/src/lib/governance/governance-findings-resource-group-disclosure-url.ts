export const GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM = "governanceFindingsResourceGroupKey";

export function parseGovernanceFindingsResourceGroupKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function governanceFindingsResourceGroupDisclosureHrefFromSearch(
  currentSearch: string,
  groupKey: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (groupKey ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM);
  } else {
    params.set(GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
