import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_DOC_SEARCH_CONCEPTS_OPEN_PARAM = "helpConceptsOpen";
export const HELP_DOC_SEARCH_FEEDBACK_OPEN_PARAM = "helpFeedbackOpen";

export type HelpDocSearchNestedPanelsUrlState = {
  readonly conceptsOpen: boolean;
  readonly feedbackOpen: boolean;
};

export function parseHelpDocSearchConceptsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseHelpDocSearchFeedbackOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpDocSearchNestedPanelsHrefFromSearch(
  currentSearch: string,
  state: HelpDocSearchNestedPanelsUrlState,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!state.conceptsOpen) {
      params.delete(HELP_DOC_SEARCH_CONCEPTS_OPEN_PARAM);
    } else {
      params.set(HELP_DOC_SEARCH_CONCEPTS_OPEN_PARAM, "1");
    }

    if (!state.feedbackOpen) {
      params.delete(HELP_DOC_SEARCH_FEEDBACK_OPEN_PARAM);
    } else {
      params.set(HELP_DOC_SEARCH_FEEDBACK_OPEN_PARAM, "1");
    }
    },
  });
}
