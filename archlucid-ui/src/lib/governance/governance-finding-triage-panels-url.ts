import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const GOVERNANCE_FINDING_TRIAGE_FOCUSED_FINDING_PARAM = "focusedFinding";

export function parseGovernanceFindingTriageFocusedFindingIdFromSearch(
  raw: string | null | undefined,
): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function governanceFindingTriagePanelsHrefFromSearch(
  currentSearch: string,
  findingId: string | null,
  pathname: string = GOVERNANCE_FINDINGS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (findingId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(GOVERNANCE_FINDING_TRIAGE_FOCUSED_FINDING_PARAM);
    } else {
      params.set(GOVERNANCE_FINDING_TRIAGE_FOCUSED_FINDING_PARAM, trimmed);
    }
    },
  });
}
