import type { ExplainStructuredBriefSuggestionResponse } from "@/lib/api/structured-brief-suggestion-explain-api";

type CacheEntry = {
  readonly response: ExplainStructuredBriefSuggestionResponse;
};

const cache = new Map<string, CacheEntry>();

/** Returns a cached explain response when present. */
export function getStructuredBriefSuggestionExplainCache(
  cacheKey: string,
): ExplainStructuredBriefSuggestionResponse | null {
  const entry = cache.get(cacheKey);

  if (entry === undefined) {
    return null;
  }

  return entry.response;
}

/** Stores an explain response for repeat disclosure opens. */
export function setStructuredBriefSuggestionExplainCache(
  cacheKey: string,
  response: ExplainStructuredBriefSuggestionResponse,
): void {
  cache.set(cacheKey, { response });
}

/** Clears the in-memory explain cache (used in tests). */
export function clearStructuredBriefSuggestionExplainCache(): void {
  cache.clear();
}
