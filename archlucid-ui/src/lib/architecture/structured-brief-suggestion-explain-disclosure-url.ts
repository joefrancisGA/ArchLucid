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
  const params = new URLSearchParams(currentSearch);
  const trimmed = (explainKey ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(STRUCTURED_BRIEF_SUGGESTION_EXPLAIN_KEY_PARAM);
  } else {
    params.set(STRUCTURED_BRIEF_SUGGESTION_EXPLAIN_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
