export const ASK_REVIEW_ANCHORS_OPEN_PARAM = "askReviewAnchorsOpen";

export function parseAskReviewAnchorsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function askReviewAnchorsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(ASK_REVIEW_ANCHORS_OPEN_PARAM);
  } else {
    params.set(ASK_REVIEW_ANCHORS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
