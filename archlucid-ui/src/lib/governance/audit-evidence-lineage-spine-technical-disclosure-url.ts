import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const AUDIT_EVIDENCE_LINEAGE_SPINE_TECHNICAL_OPEN_PARAM = "auditEvidenceLineageSpineTechnicalOpen";

export function parseAuditEvidenceLineageSpineTechnicalOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function auditEvidenceLineageSpineTechnicalDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, AUDIT_EVIDENCE_LINEAGE_SPINE_TECHNICAL_OPEN_PARAM);
}
