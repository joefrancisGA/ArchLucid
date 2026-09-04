import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { POLICY_PACKS_TAB_QUERY_PARAM } from "@/lib/policy/policy-packs-deep-link";

export type PolicyPacksTabId = "my-packs" | "catalog" | "generator" | "author";

const POLICY_PACKS_TAB_IDS = new Set<string>(["my-packs", "catalog", "generator", "author"]);

export function parsePolicyPacksTabFromSearch(raw: string | null | undefined): PolicyPacksTabId {
  if (raw === null || raw === undefined) {
    return "my-packs";
  }

  const trimmed = raw.trim();

  if (!POLICY_PACKS_TAB_IDS.has(trimmed)) {
    return "my-packs";
  }

  return trimmed as PolicyPacksTabId;
}

export function policyPacksTabHrefFromSearch(
  currentSearch: string,
  tab: PolicyPacksTabId,
  pathname: string = GOVERNANCE_POLICY_PACKS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (tab === "my-packs") {
    params.delete(POLICY_PACKS_TAB_QUERY_PARAM);
  } else {
    params.set(POLICY_PACKS_TAB_QUERY_PARAM, tab);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
