import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";

/**
 * TB-2194 — finding lifecycle across two reviews.
 *
 * Mirrors `CrossReviewFindingLifecycleSummary`. The three "no longer raised" buckets are deliberately kept apart:
 * collapsing them into a single "resolved" number would claim remediation that ArchLucid has not established.
 */
export const COMPARE_FINDING_LIFECYCLE_ANCHOR = "compare-finding-lifecycle";

export type CompareFindingLifecycleState =
  | "NewlyIdentified"
  | "PreviouslyIdentifiedStillPresent"
  | "CandidateResolved";

export type CompareFindingResolutionBasis =
  | "NotApplicable"
  | "ConfirmedByDisposition"
  | "Unverified"
  | "AbsenceNotInformative";

export type CompareFindingLifecycleRecord = {
  readonly state: CompareFindingLifecycleState;
  readonly resolutionBasis: CompareFindingResolutionBasis;
  readonly priorFindingId: string | null;
  readonly currentFindingId: string | null;
  readonly correlationMethod: string;
  readonly severity: string;
  readonly category: string;
  readonly message: string;
  readonly sourceAgent: string;
  readonly latestDisposition: string | null;
};

export type CompareFindingLifecycleSummary = {
  readonly newlyIdentifiedCount: number;
  readonly previouslyIdentifiedStillPresentCount: number;
  readonly confirmedResolvedCount: number;
  readonly unverifiedResolvedCount: number;
  readonly absenceNotInformativeCount: number;
  readonly honestyNote: string;
};

export const COMPARE_FINDING_LIFECYCLE_HEADING = "Finding lifecycle across these reviews";

function readNonNegativeInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

function readString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

/** Coerces API `findingLifecycle` wire JSON into a typed view model; returns null when absent or unusable. */
export function coerceCompareFindingLifecycleSummary(
  raw: unknown,
): CompareFindingLifecycleSummary | null {
  if (raw === null || raw === undefined || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const honestyNote = readString(record.honestyNote);

  // The note is always populated server-side, so its absence means the payload is not a lifecycle summary.
  if (honestyNote.length === 0) {
    return null;
  }

  return {
    newlyIdentifiedCount: readNonNegativeInt(record.newlyIdentifiedCount),
    previouslyIdentifiedStillPresentCount: readNonNegativeInt(record.previouslyIdentifiedStillPresentCount),
    confirmedResolvedCount: readNonNegativeInt(record.confirmedResolvedCount),
    unverifiedResolvedCount: readNonNegativeInt(record.unverifiedResolvedCount),
    absenceNotInformativeCount: readNonNegativeInt(record.absenceNotInformativeCount),
    honestyNote,
  };
}

export type CompareFindingLifecycleCountRow = {
  readonly label: string;
  readonly value: number;
  readonly testId: string;
};

/** Count rows in lifecycle order (identified, still present, then each drop-out basis). */
const LIFECYCLE_STATE_BY_WIRE: Readonly<Record<string, CompareFindingLifecycleState>> = {
  newlyIdentified: "NewlyIdentified",
  NewlyIdentified: "NewlyIdentified",
  "0": "NewlyIdentified",
  previouslyIdentifiedStillPresent: "PreviouslyIdentifiedStillPresent",
  PreviouslyIdentifiedStillPresent: "PreviouslyIdentifiedStillPresent",
  "1": "PreviouslyIdentifiedStillPresent",
  candidateResolved: "CandidateResolved",
  CandidateResolved: "CandidateResolved",
  "2": "CandidateResolved",
};

const RESOLUTION_BASIS_BY_WIRE: Readonly<Record<string, CompareFindingResolutionBasis>> = {
  notApplicable: "NotApplicable",
  NotApplicable: "NotApplicable",
  "0": "NotApplicable",
  confirmedByDisposition: "ConfirmedByDisposition",
  ConfirmedByDisposition: "ConfirmedByDisposition",
  "1": "ConfirmedByDisposition",
  unverified: "Unverified",
  Unverified: "Unverified",
  "2": "Unverified",
  absenceNotInformative: "AbsenceNotInformative",
  AbsenceNotInformative: "AbsenceNotInformative",
  "3": "AbsenceNotInformative",
};

function readOptionalString(value: unknown): string | null {
  const trimmed = readString(value);

  return trimmed.length > 0 ? trimmed : null;
}

function readLifecycleState(value: unknown): CompareFindingLifecycleState | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return LIFECYCLE_STATE_BY_WIRE[String(Math.trunc(value))] ?? null;
  }

  if (typeof value !== "string") {
    return null;
  }

  return LIFECYCLE_STATE_BY_WIRE[value.trim()] ?? null;
}

function readResolutionBasis(value: unknown): CompareFindingResolutionBasis {
  if (typeof value === "number" && Number.isFinite(value)) {
    return RESOLUTION_BASIS_BY_WIRE[String(Math.trunc(value))] ?? "NotApplicable";
  }

  if (typeof value !== "string") {
    return "NotApplicable";
  }

  return RESOLUTION_BASIS_BY_WIRE[value.trim()] ?? "NotApplicable";
}

/** Coerces API `findingLifecycleRecords` wire JSON; drops malformed rows instead of failing the whole list. */
export function coerceCompareFindingLifecycleRecords(raw: unknown): readonly CompareFindingLifecycleRecord[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const records: CompareFindingLifecycleRecord[] = [];

  for (const item of raw) {
    if (item === null || item === undefined || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;
    const state = readLifecycleState(record.state);

    if (state === null) {
      continue;
    }

    records.push({
      state,
      resolutionBasis: readResolutionBasis(record.resolutionBasis),
      priorFindingId: readOptionalString(record.priorFindingId),
      currentFindingId: readOptionalString(record.currentFindingId),
      correlationMethod: readString(record.correlationMethod),
      severity: readString(record.severity),
      category: readString(record.category),
      message: readString(record.message),
      sourceAgent: readString(record.sourceAgent),
      latestDisposition: readOptionalString(record.latestDisposition),
    });
  }

  return records;
}

export function compareFindingLifecycleStateLabel(state: CompareFindingLifecycleState): string {
  switch (state) {
    case "NewlyIdentified":
      return "Newly identified";
    case "PreviouslyIdentifiedStillPresent":
      return "Still present from baseline";
    case "CandidateResolved":
      return "No longer raised";
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}

export function compareFindingResolutionBasisLabel(basis: CompareFindingResolutionBasis): string {
  switch (basis) {
    case "NotApplicable":
      return "Not applicable";
    case "ConfirmedByDisposition":
      return "Confirmed by recorded decision";
    case "Unverified":
      return "No decision recorded";
    case "AbsenceNotInformative":
      return "Producing analysis did not run again";
    default: {
      const exhaustive: never = basis;
      return exhaustive;
    }
  }
}

/** One-line status for tables and finding inspect; never uses plain "resolved". */
export function buildCompareFindingLifecycleStatusSentence(record: CompareFindingLifecycleRecord): string {
  if (record.state === "CandidateResolved") {
    return `${compareFindingLifecycleStateLabel(record.state)} — ${compareFindingResolutionBasisLabel(record.resolutionBasis)}`;
  }

  return compareFindingLifecycleStateLabel(record.state);
}

export function comparePageHrefWithLifecycleAnchor(priorRunId: string, laterRunId: string): string {
  return `${comparePageHrefAdaptive(priorRunId, laterRunId)}#${COMPARE_FINDING_LIFECYCLE_ANCHOR}`;
}

export function buildCompareFindingLifecycleCountRows(
  summary: CompareFindingLifecycleSummary,
): readonly CompareFindingLifecycleCountRow[] {
  return [
    {
      label: "Newly identified",
      value: summary.newlyIdentifiedCount,
      testId: "compare-finding-lifecycle-newly-identified",
    },
    {
      label: "Still present from the baseline review",
      value: summary.previouslyIdentifiedStillPresentCount,
      testId: "compare-finding-lifecycle-still-present",
    },
    {
      label: "Confirmed remediated by a recorded decision",
      value: summary.confirmedResolvedCount,
      testId: "compare-finding-lifecycle-confirmed",
    },
    {
      label: "No longer raised, no decision recorded",
      value: summary.unverifiedResolvedCount,
      testId: "compare-finding-lifecycle-unverified",
    },
    {
      label: "No longer raised, analysis did not run again",
      value: summary.absenceNotInformativeCount,
      testId: "compare-finding-lifecycle-not-informative",
    },
  ];
}
