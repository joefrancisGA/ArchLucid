export const PAGE_CONTEXTUAL_HELP_OPEN_PARAM = "pageHelpOpen";
export const PAGE_CONTEXTUAL_HELP_SECTION_PARAM = "pageHelpSection";

export type PageContextualHelpPanelUrlState = {
  readonly open: boolean;
  readonly sectionId: string | null;
};

export function parsePageContextualHelpOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parsePageContextualHelpSectionFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function pageContextualHelpPanelHrefFromSearch(
  currentSearch: string,
  state: PageContextualHelpPanelUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const sectionId = (state.sectionId ?? "").trim();

  if (!state.open) {
    params.delete(PAGE_CONTEXTUAL_HELP_OPEN_PARAM);
    params.delete(PAGE_CONTEXTUAL_HELP_SECTION_PARAM);
  } else {
    params.set(PAGE_CONTEXTUAL_HELP_OPEN_PARAM, "1");

    if (sectionId.length === 0) {
      params.delete(PAGE_CONTEXTUAL_HELP_SECTION_PARAM);
    } else {
      params.set(PAGE_CONTEXTUAL_HELP_SECTION_PARAM, sectionId);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
