import {
  formatAdvisoryScheduleInstant,
  resolveBrowserTimeZoneId,
} from "@/lib/advisory-schedule-form";
import { formatIanaTimeZoneOptionLabel, isUtcIanaTimeZoneId, toStoredIanaTimeZoneId } from "@/lib/iana-time-zone-select";
import {
  buildLocalOffsetBasis,
  describeAliasCronLocal,
  describeLocalCadence,
} from "@/lib/recurrence-local-time-format";
import {
  classifyCadence,
  describeUtcCadence,
  findRepresentativeUtcInstantForCron,
  parseFiveFieldUtcCron,
} from "@/lib/recurrence-local-time-cron";

export {
  findRepresentativeUtcInstantForCron,
} from "@/lib/recurrence-local-time-cron";

export type RecurrenceLocalTimeSummary = {
  readonly timeZoneId: string;
  readonly localPrimary: string;
  /** DST / multi-occurrence qualifier — rendered as helper text, not in the accessible name. */
  readonly localOffsetBasis?: string;
  readonly utcSecondary: string;
  readonly isUtcZone: boolean;
};

export type BuildRecurrenceLocalTimeSummaryInput = {
  readonly cronExpression?: string | null;
  readonly nextRunUtc?: string | null;
  /** IANA zone for paraphrase; defaults to the browser zone. */
  readonly ianaTimeZoneId?: string | null;
  /** Deterministic "now" for representative cron matching (tests). */
  readonly referenceUtc?: string | Date | null;
};

/** Resolves display zone: explicit IANA, else browser, else UTC. */
export function resolveRecurrenceDisplayTimeZoneId(ianaTimeZoneId?: string | null): string {
  const trimmed = ianaTimeZoneId?.trim() ?? "";

  if (trimmed.length > 0) {
    return toStoredIanaTimeZoneId(trimmed);
  }

  return resolveBrowserTimeZoneId();
}

/**
 * TB-2210 — customer-facing local paraphrase for a UTC recurrence cron (or next-run instant).
 * Server semantics stay UTC; this is display honesty only.
 */
export function buildRecurrenceLocalTimeSummary(
  input: BuildRecurrenceLocalTimeSummaryInput,
): RecurrenceLocalTimeSummary {
  const trimmedZone = input.ianaTimeZoneId?.trim() ?? "";
  const isBrowserSniffed = trimmedZone.length === 0;
  const timeZoneId = resolveRecurrenceDisplayTimeZoneId(input.ianaTimeZoneId);
  const isUtcZone = isUtcIanaTimeZoneId(timeZoneId);
  const cronExpression = input.cronExpression?.trim() ?? "";
  const parsed = cronExpression.length > 0 ? parseFiveFieldUtcCron(cronExpression) : null;
  const utcSecondary =
    cronExpression.length > 0 ? describeUtcCadence(cronExpression, parsed) : "UTC schedule";

  const nextRun =
    typeof input.nextRunUtc === "string" && input.nextRunUtc.trim().length > 0
      ? new Date(input.nextRunUtc)
      : null;

  if (nextRun !== null && Number.isFinite(nextRun.getTime()) && cronExpression.length === 0) {
    const formatted = formatAdvisoryScheduleInstant(nextRun, timeZoneId);

    return {
      timeZoneId,
      localPrimary: formatted.primary,
      utcSecondary: formatted.utcSecondary,
      isUtcZone,
    };
  }

  if (parsed === null) {
    if (cronExpression.length === 0) {
      return {
        timeZoneId,
        localPrimary: "Choose a schedule to see the local-time equivalent",
        utcSecondary: "UTC schedule",
        isUtcZone,
      };
    }

    return describeAliasCronLocal(cronExpression, timeZoneId);
  }

  const representative =
    nextRun !== null && Number.isFinite(nextRun.getTime())
      ? nextRun
      : findRepresentativeUtcInstantForCron(cronExpression, input.referenceUtc);

  if (representative === null) {
    return {
      timeZoneId,
      localPrimary: isUtcZone
        ? utcSecondary
        : `Local equivalent unavailable for this expression (${formatIanaTimeZoneOptionLabel(timeZoneId)})`,
      utcSecondary,
      isUtcZone,
    };
  }

  const kind = classifyCadence(parsed);

  // When the operator is in UTC, keep a single honest line (no fake local shift).
  if (isUtcZone) {
    const localPrimary =
      isBrowserSniffed && utcSecondary.length > 0
        ? `${utcSecondary} (from your browser)`
        : utcSecondary;

    return {
      timeZoneId,
      localPrimary,
      utcSecondary: "",
      isUtcZone,
    };
  }

  const localCadence = describeLocalCadence(kind, parsed, representative, timeZoneId, isBrowserSniffed);
  const offsetBasis = buildLocalOffsetBasis(cronExpression, representative, timeZoneId);

  return {
    timeZoneId,
    localPrimary: localCadence.primary,
    localOffsetBasis: offsetBasis,
    utcSecondary,
    isUtcZone,
  };
}

/** Next/last run label: local primary, UTC secondary technical detail. */
export function formatRecurrenceInstantLocalFirst(
  utc: string | null | undefined,
  ianaTimeZoneId?: string | null,
): RecurrenceLocalTimeSummary {
  const timeZoneId = resolveRecurrenceDisplayTimeZoneId(ianaTimeZoneId);
  const isUtcZone = isUtcIanaTimeZoneId(timeZoneId);

  if (!utc) {
    return {
      timeZoneId,
      localPrimary: "\u2014",
      utcSecondary: "",
      isUtcZone,
    };
  }

  const parsed = new Date(utc);

  if (Number.isNaN(parsed.getTime())) {
    return {
      timeZoneId,
      localPrimary: utc,
      utcSecondary: "",
      isUtcZone,
    };
  }

  const formatted = formatAdvisoryScheduleInstant(parsed, timeZoneId);

  if (isUtcZone) {
    return {
      timeZoneId,
      localPrimary: formatted.utcSecondary,
      utcSecondary: "",
      isUtcZone,
    };
  }

  return {
    timeZoneId,
    localPrimary: formatted.primary,
    utcSecondary: formatted.utcSecondary,
    isUtcZone,
  };
}
