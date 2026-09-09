export const AUDIT_EVIDENCE_SPINE_EVIDENCE_TECHNICAL_ROW_ID_PARAM = "auditEvidenceSpineEvidenceTechnicalRowId";

export function parseAuditEvidenceSpineEvidenceTechnicalRowIdFromSearch(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  return trimmed.length === 0 ? null : trimmed;
}

export function auditEvidenceSpineEvidenceTechnicalDisclosureHrefFromSearch(
  currentSearch: string,
  evidenceRowId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (evidenceRowId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(AUDIT_EVIDENCE_SPINE_EVIDENCE_TECHNICAL_ROW_ID_PARAM);
  } else {
    params.set(AUDIT_EVIDENCE_SPINE_EVIDENCE_TECHNICAL_ROW_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
