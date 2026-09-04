import { MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH } from "@/lib/model-governance-settings-evidence-copy";

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
  const params = new URLSearchParams(currentSearch);

  if (!confirmOpen) {
    params.delete(MODEL_GOVERNANCE_ENGINE_RESET_CONFIRM_PARAM);
  } else {
    params.set(MODEL_GOVERNANCE_ENGINE_RESET_CONFIRM_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
