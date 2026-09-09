export const FIRST_WEEK_ROUTE_GUIDANCE_REVIEW_DETAIL_OPEN_PARAM = "firstWeekRouteGuidanceReviewDetailOpen";

export function parseFirstWeekRouteGuidanceReviewDetailOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function firstWeekRouteGuidanceReviewDetailDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(FIRST_WEEK_ROUTE_GUIDANCE_REVIEW_DETAIL_OPEN_PARAM);
  } else {
    params.set(FIRST_WEEK_ROUTE_GUIDANCE_REVIEW_DETAIL_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
