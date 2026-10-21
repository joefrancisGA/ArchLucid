import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const GRAPH_EVIDENCE_TRAIL_ERROR_TECHNICAL_DETAILS_OPEN_PARAM = "graphEvidenceTrailErrorTechnicalDetailsOpen";

export function parseGraphEvidenceTrailErrorTechnicalDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function graphEvidenceTrailErrorTechnicalDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, GRAPH_EVIDENCE_TRAIL_ERROR_TECHNICAL_DETAILS_OPEN_PARAM);
}
