/** Structured-brief suggestion helpers (barrel). */

export { buildArchitectureDraftSuggestionSourceText } from "./architecture-draft-structured-brief-suggestions-source-text";
export {
  applyArchitectureDraftStructuredBriefSuggestionsFromDraftResponse,
  applyFailureModeSuggestionIfEmpty,
  hasArchitectureContextForFailureModeSuggestion,
  resolveFailureModeSuggestion,
  type ApplyArchitectureDraftStructuredBriefSuggestionsResult,
  type ApplyFailureModeSuggestionResult,
} from "./architecture-draft-structured-brief-suggestions-apply";
export {
  buildDeterministicStructuredBriefSuggestionsFromText,
  extractFailureModeSuggestionFromText,
  extractQualityAttributeSuggestionsFromText,
} from "./architecture-draft-structured-brief-suggestions-extract";
