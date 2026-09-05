export const REVIEW_HEADER_SHARE_MENU_OPEN_PARAM = "shareMenuOpen";

export function parseReviewHeaderShareMenuOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function reviewHeaderShareMenuHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(REVIEW_HEADER_SHARE_MENU_OPEN_PARAM);
  } else {
    params.set(REVIEW_HEADER_SHARE_MENU_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
