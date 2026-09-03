import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const GOVERNANCE_FINDINGS_GROUP_BY_PARAM = "groupBy";
export const GOVERNANCE_FINDINGS_GROUP_BY_RESOURCE_VALUE = "resource";

export function parseGovernanceFindingsGroupByResourceFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  return raw.trim() === GOVERNANCE_FINDINGS_GROUP_BY_RESOURCE_VALUE;
}

export function governanceFindingsGroupByHrefFromSearch(
  currentSearch: string,
  groupByResource: boolean,
  pathname: string = GOVERNANCE_FINDINGS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!groupByResource) {
    params.delete(GOVERNANCE_FINDINGS_GROUP_BY_PARAM);
  } else {
    params.set(GOVERNANCE_FINDINGS_GROUP_BY_PARAM, GOVERNANCE_FINDINGS_GROUP_BY_RESOURCE_VALUE);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
