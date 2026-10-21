import { HELP_HUB_PATH } from "@/lib/help/help-hub-search-url";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const HELP_ADVANCED_TOPICS_OPEN_PARAM = "helpAdvancedTopicsOpen";

export function parseHelpAdvancedTopicsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpAdvancedTopicsHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string = HELP_HUB_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!open) {
      params.delete(HELP_ADVANCED_TOPICS_OPEN_PARAM);
    } else {
      params.set(HELP_ADVANCED_TOPICS_OPEN_PARAM, "1");
    }
    },
  });
}
