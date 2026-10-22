import { MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH } from "@/lib/model-governance-settings-evidence-copy";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const MODEL_GOVERNANCE_ENGINE_RESET_CONFIRM_PARAM = "engineResetConfirm";

export function parseModelGovernanceEngineResetConfirmOpenFromSearch(
  raw: string | null | undefined,
): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function modelGovernanceEngineResetConfirmHrefFromSearch(
  currentSearch: string,
  confirmOpen: boolean,
  pathname: string = MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!confirmOpen) {
      params.delete(MODEL_GOVERNANCE_ENGINE_RESET_CONFIRM_PARAM);
    } else {
      params.set(MODEL_GOVERNANCE_ENGINE_RESET_CONFIRM_PARAM, "1");
    }
    },
  });
}
