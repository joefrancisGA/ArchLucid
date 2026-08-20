import type { ActorDescriptor, DraftRequestDocument } from "@/types/draft-intake";

/** Explicit unknown sentinel — silence is not treated as “none” (TB-2282). */
export const ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL = "Unknown — confirm before review" as const;

export type ArchitectureDraftStructuredBriefState = {
  readonly confirmedConstraints: readonly string[];
  readonly confirmedAssumptions: readonly string[];
  readonly confirmedRequiredCapabilities: readonly string[];
  readonly suggestedConstraints: readonly string[];
  readonly suggestedAssumptions: readonly string[];
  readonly suggestedRequiredCapabilities: readonly string[];
  readonly qualityAttribute: string;
  readonly failureModeNote: string;
  readonly operationalOwner: string;
};

export function emptyArchitectureDraftStructuredBrief(): ArchitectureDraftStructuredBriefState {
  return {
    confirmedConstraints: [],
    confirmedAssumptions: [],
    confirmedRequiredCapabilities: [],
    suggestedConstraints: [],
    suggestedAssumptions: [],
    suggestedRequiredCapabilities: [],
    qualityAttribute: "",
    failureModeNote: "",
    operationalOwner: "",
  };
}

/** TB-2343: unknown placeholders are not confirmed facts for readiness or projection. */
export function isUnknownConfirmSentinel(value: string): boolean {
  return value.trim() === ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL;
}

export function isConfirmedBriefEntry(value: string): boolean {
  const trimmed = value.trim();

  return trimmed.length > 0 && !isUnknownConfirmSentinel(trimmed);
}

export function listHasConfirmedEntry(items: readonly string[]): boolean {
  return items.some((item) => isConfirmedBriefEntry(item));
}

export function listHasUnknownConfirmSentinel(items: readonly string[]): boolean {
  return items.some((item) => isUnknownConfirmSentinel(item));
}

/**
 * Unknown and stated facts cannot coexist on the same chip list.
 * Mark unknown stays off once a real item is selected, or once unknown is already set.
 */
export function isMarkUnknownControlDisabled(
  items: readonly string[],
  editorDisabled: boolean,
): boolean {
  if (editorDisabled) {
    return true;
  }

  if (listHasConfirmedEntry(items)) {
    return true;
  }

  return listHasUnknownConfirmSentinel(items);
}

/** Input, Add, and Confirm stay off while the unknown sentinel is selected. */
export function areConfirmedFactControlsDisabled(
  items: readonly string[],
  editorDisabled: boolean,
  allowMarkUnknown: boolean,
): boolean {
  if (editorDisabled) {
    return true;
  }

  if (!allowMarkUnknown) {
    return false;
  }

  return listHasUnknownConfirmSentinel(items);
}

export function markUnknownDisabledReason(items: readonly string[]): string | undefined {
  if (listHasConfirmedEntry(items)) {
    return "Remove selected items before marking this field unknown.";
  }

  if (listHasUnknownConfirmSentinel(items)) {
    return "This field is already marked unknown.";
  }

  return undefined;
}

export function confirmedFactControlsDisabledReason(
  items: readonly string[],
  allowMarkUnknown: boolean,
): string | undefined {
  if (!allowMarkUnknown) {
    return undefined;
  }

  if (!listHasUnknownConfirmSentinel(items)) {
    return undefined;
  }

  return "Remove the unknown marker before adding or confirming items.";
}

/**
 * Adds either the unknown sentinel or a stated fact, never both.
 * Stated facts replace an existing unknown marker; unknown is ignored when facts exist.
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
    if (listHasConfirmedEntry(existing)) {
      return [...existing];
    }

    return mergeUniqueStrings(existing, [ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL]);
  }

  const withoutUnknown = existing.filter((item) => !isUnknownConfirmSentinel(item));

  return mergeUniqueStrings(withoutUnknown, [trimmed]);
}

export function qualityAttributeMeetsMinimum(value: string): boolean {
  const entries = parseQualityAttributeEntries(value);

  return entries.some((entry) => isConfirmedBriefEntry(entry));
}

/** Splits a stored quality-attribute string into chip entries (semicolon-delimited). */
export function parseQualityAttributeEntries(value: string): string[] {
  return value
    .split(";")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/** Joins quality-attribute chips back into the persisted brief string. */
export function joinQualityAttributeEntries(entries: readonly string[]): string {
  return entries.join("; ");
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

export type ApplyIncomingStructuredBriefSuggestionsResult = {
  readonly brief: ArchitectureDraftStructuredBriefState;
  readonly addedSuggestionCount: number;
};

function mergeSuggestedBriefList(
  confirmed: readonly string[],
  suggested: readonly string[],
  incoming: readonly string[],
): { readonly mergedSuggested: string[]; readonly addedCount: number } {
  const seen = new Set(
    [...confirmed, ...suggested]
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
  const constraints = mergeSuggestedBriefList(
    current.confirmedConstraints,
    current.suggestedConstraints,
    incoming.suggestedConstraints,
  );
  const assumptions = mergeSuggestedBriefList(
    current.confirmedAssumptions,
    current.suggestedAssumptions,
    incoming.suggestedAssumptions,
  );
  const capabilities = mergeSuggestedBriefList(
    current.confirmedRequiredCapabilities,
    current.suggestedRequiredCapabilities,
    incoming.suggestedCapabilities,
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
    qualityAttribute: brief.qualityAttribute ?? "",
    failureModeNote: brief.failureModeNote ?? "",
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
    qualityAttribute: brief.qualityAttribute.trim(),
    failureModeNote: brief.failureModeNote.trim(),
    operationalOwner: brief.operationalOwner.trim(),
  };
}
