import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";

export const POLICY_PACK_VERSION_DIFF_PARAM = "diff";
export const POLICY_PACK_COMPARE_LEFT_PARAM = "compareLeft";
export const POLICY_PACK_COMPARE_RIGHT_PARAM = "compareRight";

export type PolicyPackVersionCompareUrlState = {
  readonly showVersionDiff: boolean;
  readonly compareLeftId: string;
  readonly compareRightId: string;
};

export function parsePolicyPackVersionDiffOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parsePolicyPackCompareVersionIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function policyPackVersionCompareHrefFromSearch(
  currentSearch: string,
  state: PolicyPackVersionCompareUrlState,
  pathname: string = GOVERNANCE_POLICY_PACKS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (state.showVersionDiff) {
    params.set(POLICY_PACK_VERSION_DIFF_PARAM, "1");
  } else {
    params.delete(POLICY_PACK_VERSION_DIFF_PARAM);
    params.delete(POLICY_PACK_COMPARE_LEFT_PARAM);
    params.delete(POLICY_PACK_COMPARE_RIGHT_PARAM);
  }

  const left = state.compareLeftId.trim();
  const right = state.compareRightId.trim();

  if (state.showVersionDiff && left.length > 0) {
    params.set(POLICY_PACK_COMPARE_LEFT_PARAM, left);
  } else {
    params.delete(POLICY_PACK_COMPARE_LEFT_PARAM);
  }

  if (state.showVersionDiff && right.length > 0) {
    params.set(POLICY_PACK_COMPARE_RIGHT_PARAM, right);
  } else {
    params.delete(POLICY_PACK_COMPARE_RIGHT_PARAM);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
