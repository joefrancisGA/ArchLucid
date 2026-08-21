import { formatIanaTimeZoneOptionLabel, toStoredIanaTimeZoneId } from "@/lib/iana-time-zone-select";
import { EXEC_DIGEST_HOUR_OPTIONS } from "@/lib/exec-digest-schedule-form";

/** Customer-facing frequency choices mapped to five-field UTC cron. */
export type AdvisoryScheduleFrequency = "daily" | "weekdays" | "weekly" | "monthly" | "custom";

export type AdvisoryScheduleFormState = {
  readonly frequency: AdvisoryScheduleFrequency;
  /** Local wall-clock hour (0–23) in `timeZoneId`. */
  readonly hourOfDay: number;
  /** Local wall-clock minute (0–59). */
  readonly minuteOfHour: number;
  readonly timeZoneId: string;
  /** Sunday=0 … Saturday=6 — used for weekly. */
  readonly dayOfWeek: number;
  /** 1–28 — used for monthly (avoids short-month ambiguity). */
  readonly dayOfMonth: number;
  readonly customCron: string;
  readonly name: string;
  readonly nameTouched: boolean;
};

export const ADVISORY_SCHEDULE_FREQUENCY_OPTIONS: readonly {
  readonly value: AdvisoryScheduleFrequency;
  readonly label: string;
}[] = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
] as const;

export const ADVISORY_SCHEDULE_DAY_OPTIONS: readonly {
  readonly value: number;
  readonly label: string;
}[] = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

export const ADVISORY_SCHEDULE_MINUTE_OPTIONS: readonly {
  readonly value: number;
  readonly label: string;
}[] = [
  { value: 0, label: ":00" },
  { value: 15, label: ":15" },
  { value: 30, label: ":30" },
  { value: 45, label: ":45" },
] as const;

export const ADVISORY_SCHEDULE_HOUR_OPTIONS = EXEC_DIGEST_HOUR_OPTIONS;

export const ADVISORY_SCHEDULE_DAY_OF_MONTH_OPTIONS: readonly {
  readonly value: number;
  readonly label: string;
}[] = Array.from({ length: 28 }, (_, index) => {
  const day = index + 1;

  return { value: day, label: String(day) };
});

const DEFAULT_AUTHORITY_PROJECT_SLUG = "default";

export function resolveBrowserTimeZoneId(): string {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone?.trim() ?? "";

    if (resolved.length > 0) {
      return toStoredIanaTimeZoneId(resolved);
    }
  } catch {
    /* Intl unavailable */
  }

  return "UTC";
}

export function createDefaultAdvisoryScheduleFormState(
  timeZoneId: string = resolveBrowserTimeZoneId(),
): AdvisoryScheduleFormState {
  return {
    frequency: "daily",
    hourOfDay: 7,
    minuteOfHour: 0,
    timeZoneId: toStoredIanaTimeZoneId(timeZoneId),
    dayOfWeek: 1,
    dayOfMonth: 1,
    customCron: "0 7 * * *",
    name: "",
    nameTouched: false,
  };
}

type ZonedDateParts = {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly weekday: number;
};

function weekdayFromShortName(short: string): number {
  switch (short) {
    case "Sun":
      return 0;
    case "Mon":
      return 1;
    case "Tue":
      return 2;
    case "Wed":
      return 3;
    case "Thu":
      return 4;
    case "Fri":
      return 5;
    case "Sat":
      return 6;
    default:
      return 0;
  }
}

/** Reads calendar parts for an instant in an IANA zone (DST-aware via Intl). */
export function getZonedDateParts(instant: Date, timeZoneId: string): ZonedDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZoneId,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(instant).map((part) => [part.type, part.value]));

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: weekdayFromShortName(parts.weekday ?? "Sun"),
  };
}

/**
 * Converts a wall-clock date/time in `timeZoneId` to a UTC `Date`.
 * Uses Intl offsets so daylight-saving transitions are not hard-coded.
 */
export function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZoneId: string,
): Date {
  const desiredAsUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0);

  const offsetAt = (utcMs: number): number => {
    const parts = getZonedDateParts(new Date(utcMs), timeZoneId);
    const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);

    return asUtc - utcMs;
  };

  let utcMs = desiredAsUtcMs - offsetAt(desiredAsUtcMs);
  utcMs = desiredAsUtcMs - offsetAt(utcMs);

  return new Date(utcMs);
}

function addCalendarDays(year: number, month: number, day: number, delta: number): {
  readonly year: number;
  readonly month: number;
  readonly day: number;
} {
  const utc = new Date(Date.UTC(year, month - 1, day + delta));

  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

/** Next local occurrence matching the form frequency (used to mint UTC cron fields). */
export function findNextLocalOccurrence(
  form: Pick<
    AdvisoryScheduleFormState,
    "frequency" | "hourOfDay" | "minuteOfHour" | "timeZoneId" | "dayOfWeek" | "dayOfMonth"
  >,
  from: Date = new Date(),
): Date {
  const timeZoneId = toStoredIanaTimeZoneId(form.timeZoneId);
  const fromParts = getZonedDateParts(from, timeZoneId);

  for (let offset = 0; offset < 62; offset += 1) {
    const cursor = addCalendarDays(fromParts.year, fromParts.month, fromParts.day, offset);
    const candidate = zonedWallTimeToUtc(
      cursor.year,
      cursor.month,
      cursor.day,
      form.hourOfDay,
      form.minuteOfHour,
      timeZoneId,
    );

    if (candidate.getTime() <= from.getTime()) {
      continue;
    }

    const candidateParts = getZonedDateParts(candidate, timeZoneId);

    if (form.frequency === "daily") {
      return candidate;
    }

    if (form.frequency === "weekdays") {
      if (candidateParts.weekday >= 1 && candidateParts.weekday <= 5) {
        return candidate;
      }

      continue;
    }

    if (form.frequency === "weekly") {
      if (candidateParts.weekday === form.dayOfWeek) {
        return candidate;
      }

      continue;
    }

    if (form.frequency === "monthly") {
      if (candidateParts.day === form.dayOfMonth) {
        return candidate;
      }
    }
  }

  return zonedWallTimeToUtc(
    fromParts.year,
    fromParts.month,
    fromParts.day,
    form.hourOfDay,
    form.minuteOfHour,
    timeZoneId,
  );
}

/** Builds a five-field UTC cron expression from customer-friendly controls. */
export function buildAdvisoryScheduleCronExpression(form: AdvisoryScheduleFormState): string {
  if (form.frequency === "custom") {
    return form.customCron.trim();
  }

  const next = findNextLocalOccurrence(form);
  const minute = next.getUTCMinutes();
  const hour = next.getUTCHours();
  const dayOfWeek = next.getUTCDay();
  const dayOfMonth = next.getUTCDate();

  if (form.frequency === "daily") {
    return `${minute} ${hour} * * *`;
  }

  if (form.frequency === "weekdays") {
    return `${minute} ${hour} * * 1-5`;
  }

  if (form.frequency === "weekly") {
    return `${minute} ${hour} * * ${dayOfWeek}`;
  }

  return `${minute} ${hour} ${dayOfMonth} * *`;
}

export function describeAdvisoryScheduleFrequency(form: AdvisoryScheduleFormState): string {
  const clock = formatLocalClockLabel(form.hourOfDay, form.minuteOfHour);
  const zone = formatIanaTimeZoneOptionLabel(form.timeZoneId);

  switch (form.frequency) {
    case "daily":
      return `Daily at ${clock} (${zone})`;
    case "weekdays":
      return `Weekdays at ${clock} (${zone})`;
    case "weekly": {
      const day =
        ADVISORY_SCHEDULE_DAY_OPTIONS.find((option) => option.value === form.dayOfWeek)?.label ?? "Monday";

      return `Weekly on ${day} at ${clock} (${zone})`;
    }
    case "monthly":
      return `Monthly on day ${form.dayOfMonth} at ${clock} (${zone})`;
    case "custom":
      return "Custom schedule";
    default: {
      const _exhaustive: never = form.frequency;

      return _exhaustive;
    }
  }
}

export function formatLocalClockLabel(hourOfDay: number, minuteOfHour: number): string {
  const normalizedHour = Number.isFinite(hourOfDay) ? Math.min(23, Math.max(0, Math.trunc(hourOfDay))) : 0;
  const normalizedMinute = Number.isFinite(minuteOfHour)
    ? Math.min(59, Math.max(0, Math.trunc(minuteOfHour)))
    : 0;
  const suffix = normalizedHour < 12 ? "AM" : "PM";
  const hour12 = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;
  const minutePart = String(normalizedMinute).padStart(2, "0");

  return `${hour12}:${minutePart} ${suffix}`;
}

/** Customer-readable instant in the selected zone; UTC shown as secondary when useful. */
export function formatAdvisoryScheduleInstant(
  instant: Date | string,
  timeZoneId: string,
): { readonly primary: string; readonly utcSecondary: string } {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  const zone = toStoredIanaTimeZoneId(timeZoneId);

  if (!Number.isFinite(date.getTime())) {
    return { primary: " — ", utcSecondary: "" };
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const parts = formatter.formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  const primary = `${lookup("weekday")}, ${lookup("month")} ${lookup("day")} at ${lookup("hour")}:${lookup("minute")} ${lookup("dayPeriod")} ${lookup("timeZoneName")}`.replace(
    /\s+/g,
    " ",
  ).trim();
  const utcSecondary = `${date.toISOString().slice(0, 10)} ${date.toISOString().slice(11, 16)} UTC`;

  return { primary, utcSecondary };
}

export function suggestedAdvisoryScheduleName(
  form: AdvisoryScheduleFormState,
  projectLabel: string,
): string {
  const project = projectLabel.trim().length > 0 ? projectLabel.trim() : "project";
  const freq =
    form.frequency === "daily"
      ? "Daily"
      : form.frequency === "weekdays"
        ? "Weekday"
        : form.frequency === "weekly"
          ? "Weekly"
          : form.frequency === "monthly"
            ? "Monthly"
            : "Custom";

  return `${freq} ${project} advisory scan`;
}

export function resolveAdvisoryScheduleName(
  form: AdvisoryScheduleFormState,
  projectLabel: string,
): string {
  if (form.nameTouched && form.name.trim().length > 0) {
    return form.name.trim();
  }

  if (form.name.trim().length > 0) {
    return form.name.trim();
  }

  return suggestedAdvisoryScheduleName(form, projectLabel);
}

/** Authority project key used by run listing — not a customer-facing slug field. */
export function resolveAdvisoryRunProjectSlug(scopeProjectId: string | null | undefined): string {
  const trimmed = scopeProjectId?.trim() ?? "";

  if (trimmed.length === 0) {
    return DEFAULT_AUTHORITY_PROJECT_SLUG;
  }

  // Pilot / demo reviews are listed under the authority project key "default".
  // Scope GUIDs are tenant routing ids, not run-list project keys.
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return DEFAULT_AUTHORITY_PROJECT_SLUG;
  }

  return trimmed;
}

export function describeStoredCronExpression(cronExpression: string): string {
  const trimmed = cronExpression.trim();

  if (trimmed === "@hourly") {
    return "About every hour";
  }

  if (trimmed === "@daily") {
    return "About every 24 hours";
  }

  if (trimmed === "@weekly") {
    return "About every 7 days";
  }

  const fiveField = /^(\d+)\s+(\d+)\s+(\*|\d+)\s+\*\s+(\*|\d(?:-\d)?)$/.exec(trimmed);

  if (fiveField === null) {
    return "Custom schedule";
  }

  const minute = Number(fiveField[1]);
  const hour = Number(fiveField[2]);
  const dayOfMonth = fiveField[3];
  const dayOfWeek = fiveField[4];
  const clock = formatLocalClockLabel(hour, minute);

  if (dayOfMonth === "*" && dayOfWeek === "*") {
    return `Daily at ${clock} UTC`;
  }

  if (dayOfMonth === "*" && dayOfWeek === "1-5") {
    return `Weekdays at ${clock} UTC`;
  }

  if (dayOfMonth === "*" && /^\d$/.test(dayOfWeek)) {
    const day =
      ADVISORY_SCHEDULE_DAY_OPTIONS.find((option) => option.value === Number(dayOfWeek))?.label ??
      "selected day";

    return `Weekly on ${day} at ${clock} UTC`;
  }

  if (dayOfWeek === "*" && /^\d+$/.test(dayOfMonth)) {
    return `Monthly on day ${dayOfMonth} at ${clock} UTC`;
  }

  return "Custom schedule";
}

export function isAdvisoryScheduleFormReadyToCreate(form: AdvisoryScheduleFormState): boolean {
  if (form.frequency === "custom") {
    return form.customCron.trim().length > 0;
  }

  if (form.hourOfDay < 0 || form.hourOfDay > 23) {
    return false;
  }

  if (form.minuteOfHour < 0 || form.minuteOfHour > 59) {
    return false;
  }

  if (form.timeZoneId.trim().length === 0) {
    return false;
  }

  if (form.frequency === "weekly" && (form.dayOfWeek < 0 || form.dayOfWeek > 6)) {
    return false;
  }

  if (form.frequency === "monthly" && (form.dayOfMonth < 1 || form.dayOfMonth > 28)) {
    return false;
  }

  return true;
}
