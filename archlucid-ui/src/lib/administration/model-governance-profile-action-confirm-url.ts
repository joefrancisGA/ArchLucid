import { isModelExecutionProfile } from "@/lib/model-execution-profile";
import { MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH } from "@/lib/model-governance-settings-evidence-copy";

export const MODEL_GOVERNANCE_PROFILE_ACTION_PARAM = "modelProfileAction";
export const MODEL_GOVERNANCE_PROFILE_ID_PARAM = "modelProfileId";

export const MODEL_GOVERNANCE_PROFILE_ACTIONS = ["select", "clear"] as const;

export type ModelGovernanceProfileAction = (typeof MODEL_GOVERNANCE_PROFILE_ACTIONS)[number];

const MODEL_GOVERNANCE_PROFILE_ACTION_SET = new Set<string>(MODEL_GOVERNANCE_PROFILE_ACTIONS);

export type ModelGovernanceProfileActionConfirmUrlState = {
  readonly action: ModelGovernanceProfileAction | null;
  readonly profileId: string | null;
};

export function parseModelGovernanceProfileActionFromSearch(
  raw: string | null | undefined,
): ModelGovernanceProfileAction | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!MODEL_GOVERNANCE_PROFILE_ACTION_SET.has(trimmed)) {
    return null;
  }

  return trimmed as ModelGovernanceProfileAction;
}

export function parseModelGovernanceProfileIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function modelGovernanceProfileActionConfirmHrefFromSearch(
  currentSearch: string,
  state: ModelGovernanceProfileActionConfirmUrlState,
  pathname: string = MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const action = state.action;
  const profileId = (state.profileId ?? "").trim();

  if (action === null) {
    params.delete(MODEL_GOVERNANCE_PROFILE_ACTION_PARAM);
    params.delete(MODEL_GOVERNANCE_PROFILE_ID_PARAM);
  } else {
    params.set(MODEL_GOVERNANCE_PROFILE_ACTION_PARAM, action);

    if (action === "select" && profileId.length > 0 && isModelExecutionProfile(profileId)) {
      params.set(MODEL_GOVERNANCE_PROFILE_ID_PARAM, profileId);
    } else {
      params.delete(MODEL_GOVERNANCE_PROFILE_ID_PARAM);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
