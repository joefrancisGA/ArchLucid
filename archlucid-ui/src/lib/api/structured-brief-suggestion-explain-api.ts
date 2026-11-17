import { sha256Hex } from "@/lib/cto-demo-audit-integrity-chain";
import type { components } from "@/lib/api-types.generated";
import { apiPostJson } from "./http";
import { trimRequiredPathSegment } from "./api-boundary-normalization";

/** Matches API minimum for structured-brief explain requests. */
export const STRUCTURED_BRIEF_EXPLAIN_MIN_SOURCE_CHARS = 20;

/** Which structured-brief list a suggestion belongs to. */
export type StructuredBriefSuggestionKind = components["schemas"]["StructuredBriefSuggestionKind"];

/** Body for POST /v1/architecture/request/draft/suggestion/explain. */
export type ExplainStructuredBriefSuggestionInput = {
  sourceText: string;
  suggestionKind: StructuredBriefSuggestionKind;
  suggestionText: string;
};

/** Plain-English rationale for one structured-brief suggestion. */
export type ExplainStructuredBriefSuggestionResponse = {
  explanation: string;
};

/** Calls POST /v1/architecture/request/draft/suggestion/explain for one suggestion row. */
export async function explainStructuredBriefSuggestion(
  input: ExplainStructuredBriefSuggestionInput,
): Promise<ExplainStructuredBriefSuggestionResponse> {
  const sourceText = trimRequiredPathSegment(input.sourceText, "sourceText");

  if (sourceText.length < STRUCTURED_BRIEF_EXPLAIN_MIN_SOURCE_CHARS) {
    throw new Error(`sourceText must be at least ${STRUCTURED_BRIEF_EXPLAIN_MIN_SOURCE_CHARS} characters.`);
  }

  return apiPostJson<ExplainStructuredBriefSuggestionResponse>(
    "/v1/architecture/request/draft/suggestion/explain",
    {
      sourceText,
      suggestionKind: input.suggestionKind,
      suggestionText: trimRequiredPathSegment(input.suggestionText, "suggestionText"),
    },
  );
}

/** Builds a stable cache key from suggestion kind, text, and source overview hash. */
export async function buildStructuredBriefSuggestionExplainCacheKey(input: {
  readonly suggestionKind: StructuredBriefSuggestionKind;
  readonly suggestionText: string;
  readonly sourceText: string;
}): Promise<string> {
  const payload = `${input.suggestionKind}|${input.suggestionText.toLowerCase()}|${input.sourceText}`;

  return sha256Hex(payload);
}
