export const FINDING_EXPLAIN_AUDIT_OPEN_PARAM = "findingExplainAuditOpen";

export function parseFindingExplainAuditOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function findingExplainAuditDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(FINDING_EXPLAIN_AUDIT_OPEN_PARAM);
  } else {
    params.set(FINDING_EXPLAIN_AUDIT_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
