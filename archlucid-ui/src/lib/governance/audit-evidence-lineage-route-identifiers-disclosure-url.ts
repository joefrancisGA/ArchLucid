import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const AUDIT_EVIDENCE_LINEAGE_ROUTE_IDENTIFIERS_OPEN_PARAM = "auditEvidenceLineageRouteIdentifiersOpen";

export function parseAuditEvidenceLineageRouteIdentifiersOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function auditEvidenceLineageRouteIdentifiersDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, AUDIT_EVIDENCE_LINEAGE_ROUTE_IDENTIFIERS_OPEN_PARAM);
}
