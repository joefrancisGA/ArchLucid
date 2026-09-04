export const ARCHITECTURE_FINDINGS_LINKED_VIEW_PARAM = "linkedView";

export function parseArchitectureFindingsLinkedViewFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function architectureFindingsLinkedViewHrefFromSearch(
  currentSearch: string,
  linkedViewOpen: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!linkedViewOpen) {
    params.delete(ARCHITECTURE_FINDINGS_LINKED_VIEW_PARAM);
  } else {
    params.set(ARCHITECTURE_FINDINGS_LINKED_VIEW_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
