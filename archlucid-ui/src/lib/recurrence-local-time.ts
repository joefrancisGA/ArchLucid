import {
  formatAdvisoryScheduleInstant,
  formatLocalClockLabel,
  getZonedDateParts,
  resolveBrowserTimeZoneId,
} from "@/lib/advisory-schedule-form";
import { findCronSchedulePresetByExpression } from "@/lib/cron-schedule-presets";
import {
  formatIanaTimeZoneOptionLabel,
  isUtcIanaTimeZoneId,
  toStoredIanaTimeZoneId,
} from "@/lib/iana-time-zone-select";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

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

type FiveFieldUtcCron = {
  readonly minute: number;
  readonly hour: number;
  readonly dayOfMonth: string;
  readonly month: string;
  readonly dayOfWeek: string;
};

type CadenceKind = "daily" | "weekly" | "monthly" | "quarterly" | "annual" | "custom";

/** Resolves display zone: explicit IANA, else browser, else UTC. */
export function resolveRecurrenceDisplayTimeZoneId(ianaTimeZoneId?: string | null): string {
  const trimmed = ianaTimeZoneId?.trim() ?? "";

  if (trimmed.length > 0) {
    return toStoredIanaTimeZoneId(trimmed);
  }

  return resolveBrowserTimeZoneId();
}

function parseReferenceUtc(referenceUtc: string | Date | null | undefined): Date {
  if (referenceUtc instanceof Date) {
    return Number.isFinite(referenceUtc.getTime()) ? referenceUtc : new Date("2026-07-20T12:00:00.000Z");
  }

  if (typeof referenceUtc === "string" && referenceUtc.trim().length > 0) {
    const parsed = new Date(referenceUtc);

    if (Number.isFinite(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

function parseFiveFieldUtcCron(expression: string): FiveFieldUtcCron | null {
  const trimmed = expression.trim();

  if (trimmed.startsWith("@")) {
    return null;
  }

  const parts = trimmed.split(/\s+/);

  if (parts.length !== 5) {
    return null;
  }

  const minute = Number(parts[0]);
  const hour = Number(parts[1]);

  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    return null;
  }

  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return null;
  }

  return {
    minute,
    hour,
    dayOfMonth: parts[2] ?? "*",
    month: parts[3] ?? "*",
    dayOfWeek: parts[4] ?? "*",
  };
}

function formatUtcClockLabel(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} UTC`;
}

function ordinalDay(day: number): string {
  const mod100 = day % 100;

  if (mod100 >= 11 && mod100 <= 13) {
    return `${day}th`;
  }

  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

function classifyCadence(parsed: FiveFieldUtcCron): CadenceKind {
  if (parsed.dayOfWeek !== "*" && parsed.dayOfMonth === "*") {
    return "weekly";
  }

  if (parsed.month === "*/3" && parsed.dayOfMonth !== "*") {
    return "quarterly";
  }

  const monthNum = parseSingleCronField(parsed.month);
  const domNum = parseSingleCronField(parsed.dayOfMonth);

  if (monthNum !== null && domNum !== null && parsed.dayOfWeek === "*") {
    return "annual";
  }

  if (parsed.dayOfMonth !== "*" && parsed.dayOfWeek === "*") {
    return "monthly";
  }

  if (parsed.dayOfMonth === "*" && parsed.dayOfWeek === "*" && parsed.month === "*") {
    return "daily";
  }

  return "custom";
}

function parseSingleCronField(field: string): number | null {
  if (!/^\d+$/.test(field)) {
    return null;
  }

  return Number(field);
}

function describeUtcCadence(cronExpression: string, parsed: FiveFieldUtcCron | null): string {
  const preset = findCronSchedulePresetByExpression(cronExpression);

  if (preset !== undefined) {
    return preset.label;
  }

  if (parsed === null) {
    const trimmed = cronExpression.trim();

    return trimmed.length > 0 ? `UTC cron: ${trimmed}` : "UTC schedule";
  }

  const clock = formatUtcClockLabel(parsed.hour, parsed.minute);
  const kind = classifyCadence(parsed);

  if (kind === "weekly") {
    const dow = parseSingleCronField(parsed.dayOfWeek);
    const dayName = dow !== null ? DAY_NAMES[dow] ?? "day" : "selected days";

    return `Weekly on ${dayName} at ${clock}`;
  }

  if (kind === "daily") {
    return `Daily at ${clock}`;
  }

  if (kind === "quarterly") {
    const dom = parseSingleCronField(parsed.dayOfMonth) ?? 1;

    return `Quarterly on the ${ordinalDay(dom)} at ${clock}`;
  }

  if (kind === "annual") {
    const dom = parseSingleCronField(parsed.dayOfMonth) ?? 1;
    const month = parseSingleCronField(parsed.month) ?? 1;
    const monthName = MONTH_NAMES[month - 1] ?? "month";

    return `Annually on ${monthName} ${dom} at ${clock}`;
  }

  if (kind === "monthly") {
    const dom = parseSingleCronField(parsed.dayOfMonth) ?? 1;

    return `Monthly on the ${ordinalDay(dom)} at ${clock}`;
  }

  return `UTC cron: ${cronExpression.trim()}`;
}

function matchesUtcCron(instant: Date, parsed: FiveFieldUtcCron): boolean {
  if (instant.getUTCMinutes() !== parsed.minute || instant.getUTCHours() !== parsed.hour) {
    return false;
  }

  const dow = parseSingleCronField(parsed.dayOfWeek);

  if (dow !== null && instant.getUTCDay() !== dow) {
    return false;
  }

  const dom = parseSingleCronField(parsed.dayOfMonth);

  if (dom !== null && instant.getUTCDate() !== dom) {
    return false;
  }

  if (parsed.month === "*/3") {
    // Months 1,4,7,10 — common quarterly pattern used by recurrence examples.
    const month = instant.getUTCMonth() + 1;

    if (month % 3 !== 1) {
      return false;
    }
  } else {
    const month = parseSingleCronField(parsed.month);

    if (month !== null && instant.getUTCMonth() + 1 !== month) {
      return false;
    }
  }

  return true;
}

/** Walks forward day-by-day from reference to find a UTC instant matching the cron wall fields. */
export function findRepresentativeUtcInstantForCron(
  cronExpression: string,
  referenceUtc?: string | Date | null,
): Date | null {
  const parsed = parseFiveFieldUtcCron(cronExpression);

  if (parsed === null) {
    return null;
  }

  const start = parseReferenceUtc(referenceUtc);
  let cursor = new Date(
    Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate(),
      parsed.hour,
      parsed.minute,
      0,
      0,
    ),
  );

  if (cursor.getTime() <= start.getTime()) {
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  for (let i = 0; i < 400; i += 1) {
    if (matchesUtcCron(cursor, parsed)) {
      return cursor;
    }

    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  return null;
}

function getShortTimeZoneOffsetName(instant: Date, timeZoneId: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZoneId,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(instant);

    return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

function getLongTimeZoneName(instant: Date, timeZoneId: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZoneId,
      timeZoneName: "long",
    });
    const parts = formatter.formatToParts(instant);

    return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

/** Friendly zone label for cadence paraphrase; notes browser-sniffed zones for auditor honesty. */
function formatRecurrenceTimeZoneLabel(
  timeZoneId: string,
  instant: Date,
  isBrowserSniffed: boolean,
): string {
  const ianaLabel = formatIanaTimeZoneOptionLabel(timeZoneId);
  const longName = getLongTimeZoneName(instant, timeZoneId);
  const friendly = longName.length > 0 ? longName : ianaLabel;

  if (isBrowserSniffed) {
    return `${friendly} (from your browser)`;
  }

  if (longName.length > 0 && longName !== ianaLabel && ianaLabel !== "UTC") {
    return `${friendly} (${ianaLabel})`;
  }

  return friendly;
}

function buildLocalOffsetBasis(
  cronExpression: string,
  representative: Date,
  timeZoneId: string,
): string | undefined {
  const repParts = getZonedDateParts(representative, timeZoneId);
  const repClock = formatLocalClockLabel(repParts.hour, repParts.minute);
  const repOffset = getShortTimeZoneOffsetName(representative, timeZoneId);
  const variants = new Map<string, string>();

  if (repOffset.length > 0) {
    variants.set(repOffset, repClock);
  }

  for (const monthOffset of [3, 6, 9, 12]) {
    const reference = new Date(representative.getTime());

    reference.setUTCMonth(reference.getUTCMonth() + monthOffset);

    const alternate = findRepresentativeUtcInstantForCron(cronExpression, reference);

    if (alternate === null) {
      continue;
    }

    const offset = getShortTimeZoneOffsetName(alternate, timeZoneId);

    if (offset.length === 0 || variants.has(offset)) {
      continue;
    }

    const parts = getZonedDateParts(alternate, timeZoneId);

    variants.set(offset, formatLocalClockLabel(parts.hour, parts.minute));
  }

  if (variants.size <= 1) {
    return undefined;
  }

  const alternates = [...variants.entries()].filter(([offset]) => offset !== repOffset);

  if (alternates.length === 1) {
    const [alternateOffset, alternateClock] = alternates[0]!;

    return `Shifts to ${alternateClock} during ${alternateOffset}.`;
  }

  const descriptions = [...variants.entries()].map(([offset, clock]) => `${clock} ${offset}`);

  return `Varies across occurrences (${descriptions.join("; ")}).`;
}

function describeLocalCadence(
  kind: CadenceKind,
  parsed: FiveFieldUtcCron,
  instant: Date,
  timeZoneId: string,
  isBrowserSniffed: boolean,
): { readonly primary: string; readonly offsetBasis?: string } {
  const parts = getZonedDateParts(instant, timeZoneId);
  const clock = formatLocalClockLabel(parts.hour, parts.minute);
  const offset = getShortTimeZoneOffsetName(instant, timeZoneId);
  const clockWithOffset = offset.length > 0 ? `${clock} ${offset}` : clock;
  const zoneLabel = formatRecurrenceTimeZoneLabel(timeZoneId, instant, isBrowserSniffed);
  const utcDom = parseSingleCronField(parsed.dayOfMonth) ?? parts.day;
  const utcMonth = parseSingleCronField(parsed.month);
  const dayName = DAY_NAMES[parts.weekday] ?? "day";

  if (kind === "weekly") {
    return {
      primary: `Weekly on ${dayName} at ${clockWithOffset} (${zoneLabel})`,
    };
  }

  if (kind === "daily") {
    return {
      primary: `Daily at ${clockWithOffset} (${zoneLabel})`,
    };
  }

  if (kind === "quarterly") {
    return {
      primary: `Quarterly on the ${ordinalDay(utcDom)} at ${clockWithOffset} (${zoneLabel})`,
    };
  }

  if (kind === "monthly") {
    return {
      primary: `Monthly on the ${ordinalDay(utcDom)} at ${clockWithOffset} (${zoneLabel})`,
    };
  }

  if (kind === "annual" && utcMonth !== null) {
    const monthName = MONTH_NAMES[utcMonth - 1] ?? "month";

    return {
      primary: `Annually on ${monthName} ${utcDom} at ${clockWithOffset} (${zoneLabel})`,
    };
  }

  return {
    primary: formatAdvisoryScheduleInstant(instant, timeZoneId).primary,
  };
}

function describeAliasCronLocal(cronExpression: string, timeZoneId: string): RecurrenceLocalTimeSummary {
  const preset = findCronSchedulePresetByExpression(cronExpression);
  const utcSecondary = preset?.label ?? `UTC cron: ${cronExpression.trim()}`;
  const isUtcZone = isUtcIanaTimeZoneId(timeZoneId);
  const zone = formatIanaTimeZoneOptionLabel(timeZoneId);

  if (cronExpression.trim() === "@hourly") {
    return {
      timeZoneId,
      localPrimary: isUtcZone
        ? "About every hour"
        : `About every hour (exact fire times follow UTC; shown in ${zone})`,
      utcSecondary,
      isUtcZone,
    };
  }

  if (cronExpression.trim() === "@daily") {
    return {
      timeZoneId,
      localPrimary: isUtcZone
        ? "About every 24 hours"
        : `About every 24 hours (exact fire times follow UTC; shown in ${zone})`,
      utcSecondary,
      isUtcZone,
    };
  }

  if (cronExpression.trim() === "@weekly") {
    return {
      timeZoneId,
      localPrimary: isUtcZone
        ? "About every 7 days"
        : `About every 7 days (exact fire times follow UTC; shown in ${zone})`,
      utcSecondary,
      isUtcZone,
    };
  }

  return {
    timeZoneId,
    localPrimary: isUtcZone ? utcSecondary : `Local equivalent uses ${zone}; schedule is stored in UTC`,
    utcSecondary,
    isUtcZone,
  };
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
    return {
      timeZoneId,
      localPrimary: utcSecondary,
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
