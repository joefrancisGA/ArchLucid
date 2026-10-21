import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const STRUCTURED_BRIEF_SUGGESTION_EXPLAIN_KEY_PARAM = "structuredBriefSuggestionExplainKey";

export function parseStructuredBriefSuggestionExplainKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function structuredBriefSuggestionExplainDisclosureHrefFromSearch(
  currentSearch: string,
  explainKey: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (explainKey ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(STRUCTURED_BRIEF_SUGGESTION_EXPLAIN_KEY_PARAM);
    } else {
      params.set(STRUCTURED_BRIEF_SUGGESTION_EXPLAIN_KEY_PARAM, trimmed);
    }
    },
  });
}
