import { PLANNING_PATH } from "@/lib/planning-route";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (themeId === null || themeId.trim().length === 0) {
      params.delete(PLANNING_THEME_PARAM);
    } else {
      params.set(PLANNING_THEME_PARAM, themeId.trim());
    }
    },
  });
}
