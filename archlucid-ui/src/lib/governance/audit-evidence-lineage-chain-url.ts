export const AUDIT_EVIDENCE_LINEAGE_CHAIN_OPEN_PARAM = "lineageChainOpen";

export function parseAuditEvidenceLineageChainOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function auditEvidenceLineageChainHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(AUDIT_EVIDENCE_LINEAGE_CHAIN_OPEN_PARAM);
  } else {
    params.set(AUDIT_EVIDENCE_LINEAGE_CHAIN_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
