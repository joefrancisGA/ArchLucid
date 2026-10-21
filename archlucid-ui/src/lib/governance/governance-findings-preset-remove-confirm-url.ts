import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";

export const GOVERNANCE_FINDINGS_REMOVE_PRESET_ID_PARAM = "removePresetId";

export function parseGovernanceFindingsRemovePresetIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function governanceFindingsPresetRemoveConfirmHrefFromSearch(
  currentSearch: string,
  presetId: string | null,
  pathname: string = GOVERNANCE_FINDINGS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "governance-findings-queue-navigation" },
    mutate: (params) => {
    const trimmed = (presetId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(GOVERNANCE_FINDINGS_REMOVE_PRESET_ID_PARAM);
    } else {
      params.set(GOVERNANCE_FINDINGS_REMOVE_PRESET_ID_PARAM, trimmed);
    }
    },
  });
}

export function governanceAssignedToMePresetRemoveConfirmHrefFromSearch(
  currentSearch: string,
  presetId: string | null,
): string {
  return governanceFindingsPresetRemoveConfirmHrefFromSearch(
    currentSearch,
    presetId,
    GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  );
}
