import { PLANNING_PATH } from "@/lib/planning-route";

export const PLANNING_THEME_PARAM = "theme";

export function parsePlanningThemeIdFromSearch(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  return trimmed;
}

export function planningThemeHrefFromSearch(
  currentSearch: string,
  themeId: string | null,
  pathname: string = PLANNING_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (themeId === null || themeId.trim().length === 0) {
    params.delete(PLANNING_THEME_PARAM);
  } else {
    params.set(PLANNING_THEME_PARAM, themeId.trim());
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
