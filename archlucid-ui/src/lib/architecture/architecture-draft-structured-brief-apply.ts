import type { ActorDescriptor, DraftRequestDocument } from "@/types/draft-intake";

import {
  emptyArchitectureDraftStructuredBrief,
  isUnknownConfirmSentinel,
  parseQualityAttributeEntries,
  STRUCTURED_BRIEF_SUGGESTED_TO_DENIED_KEY,
  type ArchitectureDraftStructuredBriefState,
  type StructuredBriefSuggestedFieldKey,
} from "./architecture-draft-structured-brief-state";

/**
 * Adds a stated fact and drops a legacy unknown sentinel on the same list.
 * Unknown values are ignored so Input/Add/Confirm cannot re-add the sentinel.
 */
export function mergeExclusiveConfirmedItem(
  existing: readonly string[],
  value: string,
): string[] {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return [...existing];
  }

  if (isUnknownConfirmSentinel(trimmed)) {
    return [...existing];
  }

  const withoutUnknown = existing.filter((item) => !isUnknownConfirmSentinel(item));

  return mergeUniqueStrings(withoutUnknown, [trimmed]);
}

export function hasConfirmedActor(actors: readonly ActorDescriptor[]): boolean {
  return actors.some((actor) => actor.origin === "Asserted");
}

export function mergeUniqueStrings(existing: readonly string[], incoming: readonly string[]): string[] {
  const seen = new Set(existing.map((value) => value.trim().toLowerCase()).filter((value) => value.length > 0));
  const merged = [...existing];

  for (const value of incoming) {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      continue;
    }

    const key = trimmed.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(trimmed);
  }

  return merged;
}

export type IncomingStructuredBriefSuggestions = {
  readonly suggestedConstraints: readonly string[];
  readonly suggestedAssumptions: readonly string[];
  readonly suggestedCapabilities: readonly string[];
};

/** Strips list markers so newline-split LLM blobs become discrete confirmable suggestions. */
function normalizeStructuredBriefSuggestionLine(line: string): string {
  return line
    .replace(/^[-*]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .trim();
}

/** Splits LLM-returned blobs that contain multiple newline-separated suggestions into discrete items. */
export function expandStructuredBriefSuggestionItems(items: readonly string[]): string[] {
  const expanded: string[] = [];

  for (const item of items) {
    const trimmed = item.trim();

    if (trimmed.length === 0) {
      continue;
    }

    const rawLines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
    const lines = rawLines.length > 0 ? rawLines : [trimmed];

    for (const line of lines) {
      const normalized = normalizeStructuredBriefSuggestionLine(line);

      if (normalized.length > 0) {
        expanded.push(normalized);
      }
    }
  }

  return expanded;
}

function countNewBriefSuggestionListItems(
  beforeItems: readonly string[],
  afterItems: readonly string[],
  confirmedItems: readonly string[],
  deniedItems: readonly string[] = [],
): number {
  const existingKeys = new Set(
    [...beforeItems, ...confirmedItems, ...deniedItems]
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0),
  );
  let addedCount = 0;

  for (const item of afterItems) {
    const key = item.trim().toLowerCase();

    if (key.length === 0 || existingKeys.has(key)) {
      continue;
    }

    existingKeys.add(key);
    addedCount += 1;
  }

  return addedCount;
}

/** Counts every structured-brief field populated by Suggest from overview for success messaging. */
export function countStructuredBriefSuggestionApplyDelta(
  before: ArchitectureDraftStructuredBriefState,
  after: ArchitectureDraftStructuredBriefState,
): number {
  const confirmableDelta =
    countNewBriefSuggestionListItems(
      before.suggestedConstraints,
      after.suggestedConstraints,
      before.confirmedConstraints,
      before.deniedConstraints,
    )
    + countNewBriefSuggestionListItems(
      before.suggestedAssumptions,
      after.suggestedAssumptions,
      before.confirmedAssumptions,
      before.deniedAssumptions,
    )
    + countNewBriefSuggestionListItems(
      before.suggestedRequiredCapabilities,
      after.suggestedRequiredCapabilities,
      before.confirmedRequiredCapabilities,
      before.deniedRequiredCapabilities,
    );

  const qualityBefore = parseQualityAttributeEntries(before.qualityAttribute);
  const qualityAfter = parseQualityAttributeEntries(after.qualityAttribute);
  const qualityDelta = countNewBriefSuggestionListItems(qualityBefore, qualityAfter, []);

  const failureModeDelta =
    before.suggestedFailureModeNote.trim().length === 0
    && after.suggestedFailureModeNote.trim().length > 0
      ? 1
      : 0;

  return confirmableDelta + qualityDelta + failureModeDelta;
}

export type ApplyIncomingStructuredBriefSuggestionsResult = {
  readonly brief: ArchitectureDraftStructuredBriefState;
  readonly addedSuggestionCount: number;
};

function mergeSuggestedBriefList(
  confirmed: readonly string[],
  suggested: readonly string[],
  denied: readonly string[],
  incoming: readonly string[],
): { readonly mergedSuggested: string[]; readonly addedCount: number } {
  const seen = new Set(
    [...confirmed, ...suggested, ...denied]
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0),
  );
  const mergedSuggested = [...suggested];
  let addedCount = 0;

  for (const value of incoming) {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      continue;
    }

    const key = trimmed.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    mergedSuggested.push(trimmed);
    addedCount += 1;
  }

  return { mergedSuggested, addedCount };
}

/** Merges draft-intake suggestions into unconfirmed suggested lists (skips confirmed duplicates). */
export function applyIncomingStructuredBriefSuggestions(
  current: ArchitectureDraftStructuredBriefState,
  incoming: IncomingStructuredBriefSuggestions,
): ApplyIncomingStructuredBriefSuggestionsResult {
  const expandedIncoming: IncomingStructuredBriefSuggestions = {
    suggestedConstraints: expandStructuredBriefSuggestionItems(incoming.suggestedConstraints),
    suggestedAssumptions: expandStructuredBriefSuggestionItems(incoming.suggestedAssumptions),
    suggestedCapabilities: expandStructuredBriefSuggestionItems(incoming.suggestedCapabilities),
  };

  const constraints = mergeSuggestedBriefList(
    current.confirmedConstraints,
    current.suggestedConstraints,
    current.deniedConstraints,
    expandedIncoming.suggestedConstraints,
  );
  const assumptions = mergeSuggestedBriefList(
    current.confirmedAssumptions,
    current.suggestedAssumptions,
    current.deniedAssumptions,
    expandedIncoming.suggestedAssumptions,
  );
  const capabilities = mergeSuggestedBriefList(
    current.confirmedRequiredCapabilities,
    current.suggestedRequiredCapabilities,
    current.deniedRequiredCapabilities,
    expandedIncoming.suggestedCapabilities,
  );

  return {
    brief: {
      ...current,
      suggestedConstraints: constraints.mergedSuggested,
      suggestedAssumptions: assumptions.mergedSuggested,
      suggestedRequiredCapabilities: capabilities.mergedSuggested,
    },
    addedSuggestionCount: constraints.addedCount + assumptions.addedCount + capabilities.addedCount,
  };
}

export function structuredBriefFromDocument(
  document: {
    readonly structuredBrief?: Partial<ArchitectureDraftStructuredBriefState> | null;
  } | null | undefined,
): ArchitectureDraftStructuredBriefState {
  const brief = document?.structuredBrief;

  if (brief === null || brief === undefined) {
    return emptyArchitectureDraftStructuredBrief();
  }

  return {
    confirmedConstraints: [...(brief.confirmedConstraints ?? [])],
    confirmedAssumptions: [...(brief.confirmedAssumptions ?? [])],
    confirmedRequiredCapabilities: [...(brief.confirmedRequiredCapabilities ?? [])],
    suggestedConstraints: [...(brief.suggestedConstraints ?? [])],
    suggestedAssumptions: [...(brief.suggestedAssumptions ?? [])],
    suggestedRequiredCapabilities: [...(brief.suggestedRequiredCapabilities ?? [])],
    deniedConstraints: [...(brief.deniedConstraints ?? [])],
    deniedAssumptions: [...(brief.deniedAssumptions ?? [])],
    deniedRequiredCapabilities: [...(brief.deniedRequiredCapabilities ?? [])],
    qualityAttribute: brief.qualityAttribute ?? "",
    failureModeNote: brief.failureModeNote ?? "",
    suggestedFailureModeNote: brief.suggestedFailureModeNote ?? "",
    deniedFailureModeNote: brief.deniedFailureModeNote ?? "",
    operationalOwner: brief.operationalOwner ?? "",
  };
}

export function structuredBriefToPatchPayload(
  brief: ArchitectureDraftStructuredBriefState,
): NonNullable<DraftRequestDocument["structuredBrief"]> {
  return {
    confirmedConstraints: [...brief.confirmedConstraints],
    confirmedAssumptions: [...brief.confirmedAssumptions],
    confirmedRequiredCapabilities: [...brief.confirmedRequiredCapabilities],
    suggestedConstraints: [...brief.suggestedConstraints],
    suggestedAssumptions: [...brief.suggestedAssumptions],
    suggestedRequiredCapabilities: [...brief.suggestedRequiredCapabilities],
    deniedConstraints: [...brief.deniedConstraints],
    deniedAssumptions: [...brief.deniedAssumptions],
    deniedRequiredCapabilities: [...brief.deniedRequiredCapabilities],
    qualityAttribute: brief.qualityAttribute.trim(),
    failureModeNote: brief.failureModeNote.trim(),
    suggestedFailureModeNote: brief.suggestedFailureModeNote.trim(),
    deniedFailureModeNote: brief.deniedFailureModeNote.trim(),
    operationalOwner: brief.operationalOwner.trim(),
  };
}

/** Moves a pending failure-mode suggestion into the confirmed note. */
export function confirmFailureModeSuggestion(
  current: ArchitectureDraftStructuredBriefState,
): ArchitectureDraftStructuredBriefState {
  const suggested = current.suggestedFailureModeNote.trim();

  if (suggested.length === 0) {
    return current;
  }

  return {
    ...current,
    failureModeNote: suggested,
    suggestedFailureModeNote: "",
  };
}

/** Persists a denied failure-mode suggestion so later suggest passes skip it. */
export function denyFailureModeSuggestion(
  current: ArchitectureDraftStructuredBriefState,
): ArchitectureDraftStructuredBriefState {
  const suggested = current.suggestedFailureModeNote.trim();

  if (suggested.length === 0) {
    return current;
  }

  return {
    ...current,
    suggestedFailureModeNote: "",
    deniedFailureModeNote: suggested,
  };
}

/** True when confirmed or denied brief facts give the rewrite pass something to ground on. */
export function structuredBriefHasRewriteGrounding(brief: ArchitectureDraftStructuredBriefState): boolean {
  return (
    brief.confirmedConstraints.length > 0
    || brief.confirmedAssumptions.length > 0
    || brief.confirmedRequiredCapabilities.length > 0
    || brief.deniedConstraints.length > 0
    || brief.deniedAssumptions.length > 0
    || brief.deniedRequiredCapabilities.length > 0
  );
}

/**
 * Stable fingerprint for overview-rewrite gating — any brief edit, including whitespace,
 * produces a new value so the rewrite button can stay disabled until the brief changes.
 */
export function fingerprintStructuredBriefForRewriteGate(brief: ArchitectureDraftStructuredBriefState): string {
  return JSON.stringify(structuredBriefToPatchPayload(brief));
}

/** Persists a denied suggestion and removes it from the suggested list. */
export function denyStructuredBriefSuggestion(
  current: ArchitectureDraftStructuredBriefState,
  suggestedKey: StructuredBriefSuggestedFieldKey,
  value: string,
): ArchitectureDraftStructuredBriefState {
  const deniedKey = STRUCTURED_BRIEF_SUGGESTED_TO_DENIED_KEY[suggestedKey];

  return {
    ...current,
    [suggestedKey]: current[suggestedKey].filter((item) => item !== value),
    [deniedKey]: mergeUniqueStrings(current[deniedKey], [value]),
  };
}
