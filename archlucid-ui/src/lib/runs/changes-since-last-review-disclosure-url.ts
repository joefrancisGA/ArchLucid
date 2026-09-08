export const CHANGES_SINCE_LAST_REVIEW_OPEN_PARAM = "changesSinceLastReviewOpen";

export function parseChangesSinceLastReviewOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function changesSinceLastReviewDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(CHANGES_SINCE_LAST_REVIEW_OPEN_PARAM);
  } else {
    params.set(CHANGES_SINCE_LAST_REVIEW_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
