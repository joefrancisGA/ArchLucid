export const FIRST_REVIEW_GUIDE_TECHNICAL_IDENTIFIERS_OPEN_PARAM = "firstReviewGuideTechnicalIdentifiersOpen";

export function parseFirstReviewGuideTechnicalIdentifiersOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function firstReviewGuideTechnicalIdentifiersDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(FIRST_REVIEW_GUIDE_TECHNICAL_IDENTIFIERS_OPEN_PARAM);
  } else {
    params.set(FIRST_REVIEW_GUIDE_TECHNICAL_IDENTIFIERS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
