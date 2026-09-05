export const RE_RUN_REVIEW_CONFIRM_OPEN_PARAM = "reRunConfirmOpen";

export function parseReRunReviewConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function reRunReviewConfirmHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(RE_RUN_REVIEW_CONFIRM_OPEN_PARAM);
  } else {
    params.set(RE_RUN_REVIEW_CONFIRM_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
