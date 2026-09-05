import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

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
  const params = new URLSearchParams(currentSearch);
  const trimmed = (findingId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(GOVERNANCE_FINDING_TRIAGE_FOCUSED_FINDING_PARAM);
  } else {
    params.set(GOVERNANCE_FINDING_TRIAGE_FOCUSED_FINDING_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
