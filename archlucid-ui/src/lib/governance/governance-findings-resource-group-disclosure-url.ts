import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "governance-findings-queue-navigation" },
    mutate: (params) => {
    const trimmed = (groupKey ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM);
    } else {
      params.set(GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM, trimmed);
    }
    },
  });
}
