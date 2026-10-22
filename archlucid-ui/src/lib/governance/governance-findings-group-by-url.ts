import { GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM } from "@/lib/governance/governance-findings-resource-group-disclosure-url";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "governance-findings-queue-navigation" },
    mutate: (params) => {
      if (!groupByResource) {
        params.delete(GOVERNANCE_FINDINGS_GROUP_BY_PARAM);
        params.delete(GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM);
      } else {
        params.set(GOVERNANCE_FINDINGS_GROUP_BY_PARAM, GOVERNANCE_FINDINGS_GROUP_BY_RESOURCE_VALUE);
      }
    },
  });
}
