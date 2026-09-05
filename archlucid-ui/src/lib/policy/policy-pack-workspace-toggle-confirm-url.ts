import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";

export const POLICY_PACK_TOGGLE_ASSIGNMENT_ID_PARAM = "packToggleAssignmentId";
export const POLICY_PACK_TOGGLE_NEXT_PARAM = "packToggleNext";

export const POLICY_PACK_TOGGLE_NEXT_VALUES = ["enable", "disable"] as const;

export type PolicyPackToggleNextValue = (typeof POLICY_PACK_TOGGLE_NEXT_VALUES)[number];

const POLICY_PACK_TOGGLE_NEXT_SET = new Set<string>(POLICY_PACK_TOGGLE_NEXT_VALUES);

export type PolicyPackWorkspaceToggleConfirmUrlState = {
  readonly assignmentId: string | null;
  readonly next: PolicyPackToggleNextValue | null;
};

export function parsePolicyPackToggleAssignmentIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parsePolicyPackToggleNextFromSearch(raw: string | null | undefined): PolicyPackToggleNextValue | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!POLICY_PACK_TOGGLE_NEXT_SET.has(trimmed)) {
    return null;
  }

  return trimmed as PolicyPackToggleNextValue;
}

export function policyPackWorkspaceToggleConfirmHrefFromSearch(
  currentSearch: string,
  state: PolicyPackWorkspaceToggleConfirmUrlState,
  pathname: string = GOVERNANCE_POLICY_PACKS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const assignmentId = (state.assignmentId ?? "").trim();

  if (assignmentId.length === 0 || state.next === null) {
    params.delete(POLICY_PACK_TOGGLE_ASSIGNMENT_ID_PARAM);
    params.delete(POLICY_PACK_TOGGLE_NEXT_PARAM);
  } else {
    params.set(POLICY_PACK_TOGGLE_ASSIGNMENT_ID_PARAM, assignmentId);
    params.set(POLICY_PACK_TOGGLE_NEXT_PARAM, state.next);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
