export const PROVENANCE_SECTION_NAV_OPEN_PARAM = "provNavOpen";

export function parseProvenanceSectionNavOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function provenanceSectionNavHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(PROVENANCE_SECTION_NAV_OPEN_PARAM);
  } else {
    params.set(PROVENANCE_SECTION_NAV_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
