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
  readonly deniedConstraints: readonly string[];
  readonly deniedAssumptions: readonly string[];
  readonly deniedRequiredCapabilities: readonly string[];
  readonly qualityAttribute: string;
  readonly failureModeNote: string;
  readonly suggestedFailureModeNote: string;
  readonly deniedFailureModeNote: string;
  readonly operationalOwner: string;
};

export type StructuredBriefDeniedFieldKey =
  | "deniedConstraints"
  | "deniedAssumptions"
  | "deniedRequiredCapabilities";

export type StructuredBriefSuggestedFieldKey =
  | "suggestedConstraints"
  | "suggestedAssumptions"
  | "suggestedRequiredCapabilities";

export const STRUCTURED_BRIEF_SUGGESTED_TO_DENIED_KEY: Readonly<
  Record<StructuredBriefSuggestedFieldKey, StructuredBriefDeniedFieldKey>
> = {
  suggestedConstraints: "deniedConstraints",
  suggestedAssumptions: "deniedAssumptions",
  suggestedRequiredCapabilities: "deniedRequiredCapabilities",
};

export function emptyArchitectureDraftStructuredBrief(): ArchitectureDraftStructuredBriefState {
  return {
    confirmedConstraints: [],
    confirmedAssumptions: [],
    confirmedRequiredCapabilities: [],
    suggestedConstraints: [],
    suggestedAssumptions: [],
    suggestedRequiredCapabilities: [],
    deniedConstraints: [],
    deniedAssumptions: [],
    deniedRequiredCapabilities: [],
    qualityAttribute: "",
    failureModeNote: "",
    suggestedFailureModeNote: "",
    deniedFailureModeNote: "",
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
