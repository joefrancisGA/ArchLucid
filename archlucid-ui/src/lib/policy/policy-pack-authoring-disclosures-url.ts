import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";

export const POLICY_PACK_AUTHORING_ADVANCED_PARAM = "advanced";
export const POLICY_PACK_AUTHORING_TOOLS_PARAM = "tools";

export type PolicyPackAuthoringDisclosuresUrlState = {
  readonly advancedOpen: boolean;
  readonly toolsOpen: boolean;
};

export function parsePolicyPackAuthoringAdvancedOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parsePolicyPackAuthoringToolsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function policyPackAuthoringDisclosuresHrefFromSearch(
  currentSearch: string,
  state: PolicyPackAuthoringDisclosuresUrlState,
  pathname: string = GOVERNANCE_POLICY_PACKS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!state.advancedOpen) {
    params.delete(POLICY_PACK_AUTHORING_ADVANCED_PARAM);
  } else {
    params.set(POLICY_PACK_AUTHORING_ADVANCED_PARAM, "1");
  }

  if (!state.toolsOpen) {
    params.delete(POLICY_PACK_AUTHORING_TOOLS_PARAM);
  } else {
    params.set(POLICY_PACK_AUTHORING_TOOLS_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
