import type { HelpTabId } from "@/components/HelpPanel";

export const HELP_PANEL_OPEN_PARAM = "help";
export const HELP_PANEL_TAB_PARAM = "helpTab";
export const HELP_PANEL_QUERY_PARAM = "helpQ";

export const HELP_PANEL_TAB_OPTIONS = ["guides", "shortcuts", "troubleshooting"] as const;

const HELP_PANEL_TAB_IDS = new Set<string>(HELP_PANEL_TAB_OPTIONS);

export type HelpPanelOverlayUrlState = {
  readonly open: boolean;
  readonly tab: HelpTabId;
  readonly query: string;
};

export function parseHelpPanelOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseHelpPanelTabFromSearch(raw: string | null | undefined): HelpTabId | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!HELP_PANEL_TAB_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as HelpTabId;
}

export function parseHelpPanelQueryFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function helpPanelOverlayHrefFromSearch(
  currentSearch: string,
  state: HelpPanelOverlayUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const query = state.query.trim();

  if (!state.open) {
    params.delete(HELP_PANEL_OPEN_PARAM);
    params.delete(HELP_PANEL_TAB_PARAM);
    params.delete(HELP_PANEL_QUERY_PARAM);
  } else {
    params.set(HELP_PANEL_OPEN_PARAM, "1");

    if (state.tab === "guides") {
      params.delete(HELP_PANEL_TAB_PARAM);
    } else {
      params.set(HELP_PANEL_TAB_PARAM, state.tab);
    }

    if (query.length === 0) {
      params.delete(HELP_PANEL_QUERY_PARAM);
    } else {
      params.set(HELP_PANEL_QUERY_PARAM, query);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
