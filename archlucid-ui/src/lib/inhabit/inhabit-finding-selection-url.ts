import {
  GOVERNANCE_FINDING_TRIAGE_FOCUSED_FINDING_PARAM,
  parseGovernanceFindingTriageFocusedFindingIdFromSearch,
} from "@/lib/governance/governance-finding-triage-panels-url";

/** IH-064 — deep-link selected finding on Working nested findings (URL query, tenant-scoped). */
export const INHABIT_FINDING_SELECTION_URL_PARAM = GOVERNANCE_FINDING_TRIAGE_FOCUSED_FINDING_PARAM;

export function parseInhabitFindingSelectionFromSearch(
  raw: string | null | undefined,
): string {
  return parseGovernanceFindingTriageFocusedFindingIdFromSearch(raw);
}
