export const OPERATOR_EVIDENCE_LIMITS_SCOPE_OPEN_PARAM = "operatorEvidenceLimitsScopeOpen";

export function parseOperatorEvidenceLimitsScopeOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function operatorEvidenceLimitsScopeDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(OPERATOR_EVIDENCE_LIMITS_SCOPE_OPEN_PARAM);
  } else {
    params.set(OPERATOR_EVIDENCE_LIMITS_SCOPE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
