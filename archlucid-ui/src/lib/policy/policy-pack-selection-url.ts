import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { POLICY_PACK_ID_QUERY_PARAM } from "@/lib/policy/policy-packs-deep-link";

export function parsePolicyPackSelectionFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function policyPackSelectionHrefFromSearch(
  currentSearch: string,
  packId: string,
  pathname: string = GOVERNANCE_POLICY_PACKS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = packId.trim();

  if (trimmed.length === 0) {
    params.delete(POLICY_PACK_ID_QUERY_PARAM);
  } else {
    params.set(POLICY_PACK_ID_QUERY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
