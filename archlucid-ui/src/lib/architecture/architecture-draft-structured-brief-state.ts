/** Types, constants, and validation helpers for architecture draft structured brief state. */

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
function normalizeUnknownSentinelKey(value: string): string {
  return value
    .trim()
    .replace(/\u2014/g, "-")
    .replace(/\u2013/g, "-")
    .toLowerCase();
}

export function isUnknownConfirmSentinel(value: string): boolean {
  return (
    normalizeUnknownSentinelKey(value) ===
    normalizeUnknownSentinelKey(ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL)
  );
}

export function isConfirmedBriefEntry(value: string): boolean {
  const trimmed = value.trim();

  return trimmed.length > 0 && !isUnknownConfirmSentinel(trimmed);
}

export function listHasConfirmedEntry(items: readonly string[]): boolean {
  return items.some((item) => isConfirmedBriefEntry(item));
}

/** Operator-facing labels for structured-brief fields that can block review start. */
export type StructuredBriefPlaceholderFieldLabel =
  | "Constraints"
  | "Assumptions"
  | "Required capabilities"
  | "Quality attributes"
  | "Failure mode note"
  | "Operational owner";

/** TB-2343 / LI-01: names which brief fields still hold only unknown sentinels. */
export function listUnconfirmedStructuredBriefFieldLabels(
  brief: ArchitectureDraftStructuredBriefState,
): StructuredBriefPlaceholderFieldLabel[] {
  const blockers: StructuredBriefPlaceholderFieldLabel[] = [];

  const listIsOnlyUnknown = (items: readonly string[]) =>
    items.length > 0 && items.every((item) => isUnknownConfirmSentinel(item));

  if (listIsOnlyUnknown(brief.confirmedConstraints)) {
    blockers.push("Constraints");
  }

  if (listIsOnlyUnknown(brief.confirmedAssumptions)) {
    blockers.push("Assumptions");
  }

  if (listIsOnlyUnknown(brief.confirmedRequiredCapabilities)) {
    blockers.push("Required capabilities");
  }

  const qualityEntries = parseQualityAttributeEntries(brief.qualityAttribute);

  if (qualityEntries.length > 0 && qualityEntries.every((entry) => isUnknownConfirmSentinel(entry))) {
    blockers.push("Quality attributes");
  }

  if (isUnknownConfirmSentinel(brief.failureModeNote)) {
    blockers.push("Failure mode note");
  }

  if (isUnknownConfirmSentinel(brief.operationalOwner)) {
    blockers.push("Operational owner");
  }

  return blockers;
}

/** TB-2343: structured brief still contains explicit unknown placeholders. */
export function hasUnconfirmedStructuredBriefPlaceholders(
  brief: ArchitectureDraftStructuredBriefState,
): boolean {
  return listUnconfirmedStructuredBriefFieldLabels(brief).length > 0;
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
