import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const FIRST_WEEK_ROUTE_GUIDANCE_HOME_OPEN_PARAM = "firstWeekRouteGuidanceHomeOpen";

export function parseFirstWeekRouteGuidanceHomeOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function firstWeekRouteGuidanceHomeDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, FIRST_WEEK_ROUTE_GUIDANCE_HOME_OPEN_PARAM);
}
