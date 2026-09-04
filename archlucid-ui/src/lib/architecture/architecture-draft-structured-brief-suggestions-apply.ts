import { ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS } from "@/lib/api/architecture-request-draft-api";
import type { ArchitectureDraftStructuredBriefState } from "@/lib/architecture/architecture-draft-structured-brief";
import {
  applyIncomingStructuredBriefSuggestions,
  isConfirmedBriefEntry,
  joinQualityAttributeEntries,
  listHasConfirmedEntry,
  mergeUniqueStrings,
  parseQualityAttributeEntries,
  type IncomingStructuredBriefSuggestions,
} from "@/lib/architecture/architecture-draft-structured-brief";

import {
  buildDeterministicStructuredBriefSuggestionsFromText,
  extractFailureModeSuggestionFromText,
  extractQualityAttributeSuggestionsFromText,
} from "./architecture-draft-structured-brief-suggestions-extract";

export type ApplyArchitectureDraftStructuredBriefSuggestionsResult = {
  readonly brief: ArchitectureDraftStructuredBriefState;
  readonly addedSuggestionCount: number;
};

/** Merges draft-intake API output, deterministic fallbacks, and quality/failure-mode hints into the brief. */
export function applyArchitectureDraftStructuredBriefSuggestionsFromDraftResponse(input: {
  readonly brief: ArchitectureDraftStructuredBriefState;
  readonly sourceText: string;
  readonly suggestedConstraints: readonly string[];
  readonly suggestedAssumptions: readonly string[];
  readonly suggestedCapabilities: readonly string[];
  readonly suggestedFailureModeNote?: string | null;
}): ApplyArchitectureDraftStructuredBriefSuggestionsResult {
  let nextBrief = input.brief;
  let addedSuggestionCount = 0;

  const incoming: IncomingStructuredBriefSuggestions = {
    suggestedConstraints: input.suggestedConstraints,
    suggestedAssumptions: input.suggestedAssumptions,
    suggestedCapabilities: input.suggestedCapabilities,
  };

  const llmApplied = applyIncomingStructuredBriefSuggestions(nextBrief, incoming);
  nextBrief = llmApplied.brief;
  addedSuggestionCount += llmApplied.addedSuggestionCount;

  const deterministicApplied = applyIncomingStructuredBriefSuggestions(
    nextBrief,
    buildDeterministicStructuredBriefSuggestionsFromText(input.sourceText),
  );
  nextBrief = deterministicApplied.brief;
  addedSuggestionCount += deterministicApplied.addedSuggestionCount;

  const qualitySuggestions = extractQualityAttributeSuggestionsFromText(input.sourceText);

  if (qualitySuggestions.length > 0) {
    const existingQuality = parseQualityAttributeEntries(nextBrief.qualityAttribute);
    const mergedQuality = mergeUniqueStrings(existingQuality, qualitySuggestions);

    if (mergedQuality.length > existingQuality.length) {
      nextBrief = {
        ...nextBrief,
        qualityAttribute: joinQualityAttributeEntries(mergedQuality),
      };
      addedSuggestionCount += mergedQuality.length - existingQuality.length;
    }
  }

  const failureModeSuggestion = resolveFailureModeSuggestion({
    llmSuggestion: input.suggestedFailureModeNote,
    sourceText: input.sourceText,
  });
  const failureModeApplied = applyFailureModeSuggestionIfEmpty(nextBrief, failureModeSuggestion);
  nextBrief = failureModeApplied.brief;

  if (failureModeApplied.applied) {
    addedSuggestionCount += 1;
  }

  return { brief: nextBrief, addedSuggestionCount };
}

export type ApplyFailureModeSuggestionResult = {
  readonly brief: ArchitectureDraftStructuredBriefState;
  readonly applied: boolean;
};

/** Stages a failure-mode suggestion for operator confirm/deny instead of auto-filling the field. */
export function applyFailureModeSuggestionIfEmpty(
  current: ArchitectureDraftStructuredBriefState,
  suggestion: string | null | undefined,
): ApplyFailureModeSuggestionResult {
  const trimmedSuggestion = suggestion?.trim() ?? "";

  if (trimmedSuggestion.length === 0) {
    return { brief: current, applied: false };
  }

  if (current.failureModeNote.trim().length > 0) {
    return { brief: current, applied: false };
  }

  if (current.suggestedFailureModeNote.trim().length > 0) {
    return { brief: current, applied: false };
  }

  const deniedKey = current.deniedFailureModeNote.trim().toLowerCase();

  if (deniedKey.length > 0 && deniedKey === trimmedSuggestion.toLowerCase()) {
    return { brief: current, applied: false };
  }

  return {
    brief: {
      ...current,
      suggestedFailureModeNote: trimmedSuggestion,
    },
    applied: true,
  };
}

/** Picks the first non-empty failure-mode note from LLM and deterministic sources. */
export function resolveFailureModeSuggestion(input: {
  readonly llmSuggestion?: string | null;
  readonly sourceText: string;
}): string | null {
  const llmTrimmed = input.llmSuggestion?.trim() ?? "";

  if (llmTrimmed.length > 0) {
    return llmTrimmed;
  }

  return extractFailureModeSuggestionFromText(input.sourceText);
}

/** True when overview or confirmed structured-brief facts give enough signal for failure-mode suggestions. */
export function hasArchitectureContextForFailureModeSuggestion(input: {
  readonly architectureOverview: string;
  readonly structuredBrief?: Pick<
    ArchitectureDraftStructuredBriefState,
    | "confirmedConstraints"
    | "confirmedAssumptions"
    | "confirmedRequiredCapabilities"
    | "qualityAttribute"
  >;
}): boolean {
  if (input.architectureOverview.trim().length >= ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS) {
    return true;
  }

  const brief = input.structuredBrief;

  if (brief === undefined) {
    return false;
  }

  return (
    listHasConfirmedEntry(brief.confirmedConstraints)
    || listHasConfirmedEntry(brief.confirmedAssumptions)
    || listHasConfirmedEntry(brief.confirmedRequiredCapabilities)
    || parseQualityAttributeEntries(brief.qualityAttribute).some((item) => isConfirmedBriefEntry(item))
  );
}
