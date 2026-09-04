import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";

export const POLICY_PACK_AUTHORING_INPUT_MODE_PARAM = "inputMode";

export type PolicyPackAuthoringInputMode = "guided" | "visual" | "json" | "ai";

const POLICY_PACK_AUTHORING_INPUT_MODE_IDS = new Set<string>(["guided", "visual", "json", "ai"]);

export function parsePolicyPackAuthoringInputModeFromSearch(
  raw: string | null | undefined,
): PolicyPackAuthoringInputMode {
  if (raw === null || raw === undefined) {
    return "guided";
  }

  const trimmed = raw.trim().toLowerCase();

  if (!POLICY_PACK_AUTHORING_INPUT_MODE_IDS.has(trimmed)) {
    return "guided";
  }

  return trimmed as PolicyPackAuthoringInputMode;
}

export function policyPackAuthoringInputModeHrefFromSearch(
  currentSearch: string,
  inputMode: PolicyPackAuthoringInputMode,
  pathname: string = GOVERNANCE_POLICY_PACKS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (inputMode === "guided") {
    params.delete(POLICY_PACK_AUTHORING_INPUT_MODE_PARAM);
  } else {
    params.set(POLICY_PACK_AUTHORING_INPUT_MODE_PARAM, inputMode);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
