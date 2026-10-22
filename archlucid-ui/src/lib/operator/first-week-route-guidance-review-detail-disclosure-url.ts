import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, FIRST_WEEK_ROUTE_GUIDANCE_REVIEW_DETAIL_OPEN_PARAM);
}
