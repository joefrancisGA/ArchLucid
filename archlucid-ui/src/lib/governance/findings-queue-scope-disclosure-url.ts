export const FINDINGS_QUEUE_SCOPE_OPEN_PARAM = "findingsQueueScopeOpen";

export function parseFindingsQueueScopeOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function findingsQueueScopeDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(FINDINGS_QUEUE_SCOPE_OPEN_PARAM);
  } else {
    params.set(FINDINGS_QUEUE_SCOPE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
