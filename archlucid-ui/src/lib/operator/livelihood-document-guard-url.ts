export const LIVELIHOOD_DOCUMENT_GUARD_OPEN_PARAM = "navGuardOpen";

export function parseLivelihoodDocumentGuardOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function livelihoodDocumentGuardHrefFromSearch(
  currentSearch: string,
  guardOpen: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!guardOpen) {
    params.delete(LIVELIHOOD_DOCUMENT_GUARD_OPEN_PARAM);
  } else {
    params.set(LIVELIHOOD_DOCUMENT_GUARD_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
