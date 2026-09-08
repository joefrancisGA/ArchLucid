export const EXPLAINABILITY_TRACE_SECTION_KEY_PARAM = "explainabilityTraceSectionKey";

export const EXPLAINABILITY_TRACE_SECTION_KEYS = {
  evidence: "evidence",
  confidence: "confidence",
  rules: "rules",
} as const;

export type ExplainabilityTraceSectionKey =
  (typeof EXPLAINABILITY_TRACE_SECTION_KEYS)[keyof typeof EXPLAINABILITY_TRACE_SECTION_KEYS];

export function parseExplainabilityTraceSectionKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function explainabilityTraceSectionDisclosureHrefFromSearch(
  currentSearch: string,
  sectionKey: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (sectionKey ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(EXPLAINABILITY_TRACE_SECTION_KEY_PARAM);
  } else {
    params.set(EXPLAINABILITY_TRACE_SECTION_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
