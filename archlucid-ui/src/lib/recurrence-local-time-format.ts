import {
  formatAdvisoryScheduleInstant,
  formatLocalClockLabel,
  getZonedDateParts,
} from "@/lib/advisory-schedule-form";
import { findCronSchedulePresetByExpression } from "@/lib/cron-schedule-presets";
import {
  formatIanaTimeZoneOptionLabel,
  isUtcIanaTimeZoneId,
} from "@/lib/iana-time-zone-select";
import type { RecurrenceLocalTimeSummary } from "@/lib/recurrence-local-time";
import {
  DAY_NAMES,
  MONTH_NAMES,
  classifyCadence,
  findRepresentativeUtcInstantForCron,
  ordinalDay,
  parseSingleCronField,
  type CadenceKind,
  type FiveFieldUtcCron,
} from "@/lib/recurrence-local-time-cron";

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

export function buildLocalOffsetBasis(
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

export function describeLocalCadence(
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

  const cadenceWithZone = (cadence: string): string => `${cadence} — ${zoneLabel}`;

  if (kind === "weekly") {
    return {
      primary: cadenceWithZone(`Weekly on ${dayName} at ${clockWithOffset}`),
    };
  }

  if (kind === "daily") {
    return {
      primary: cadenceWithZone(`Daily at ${clockWithOffset}`),
    };
  }

  if (kind === "quarterly") {
    return {
      primary: cadenceWithZone(`Quarterly on the ${ordinalDay(utcDom)} at ${clockWithOffset}`),
    };
  }

  if (kind === "monthly") {
    return {
      primary: cadenceWithZone(`Monthly on the ${ordinalDay(utcDom)} at ${clockWithOffset}`),
    };
  }

  if (kind === "annual" && utcMonth !== null) {
    const monthName = MONTH_NAMES[utcMonth - 1] ?? "month";

    return {
      primary: cadenceWithZone(`Annually on ${monthName} ${utcDom} at ${clockWithOffset}`),
    };
  }

  return {
    primary: formatAdvisoryScheduleInstant(instant, timeZoneId).primary,
  };
}

export function describeAliasCronLocal(cronExpression: string, timeZoneId: string): RecurrenceLocalTimeSummary {
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
