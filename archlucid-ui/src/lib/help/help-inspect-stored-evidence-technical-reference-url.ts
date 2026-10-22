import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_INSPECT_STORED_EVIDENCE_TECHNICAL_REFERENCE_OPEN_PARAM =
  "helpInspectStoredEvidenceTechnicalReferenceOpen";

export function parseHelpInspectStoredEvidenceTechnicalReferenceOpenFromSearch(
  raw: string | null | undefined,
): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpInspectStoredEvidenceTechnicalReferenceHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_INSPECT_STORED_EVIDENCE_TECHNICAL_REFERENCE_OPEN_PARAM);
}
