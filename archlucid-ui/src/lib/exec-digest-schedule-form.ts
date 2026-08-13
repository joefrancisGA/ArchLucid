import { formatIanaTimeZoneOptionLabel } from "@/lib/iana-time-zone-select";
import type { ExecDigestPreferencesResponse, ExecDigestPreferencesUpsertRequest } from "@/types/exec-digest-preferences";

export const EXEC_DIGEST_DAY_NAMES: readonly string[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ExecDigestScheduleFormState = {
  readonly emailEnabled: boolean;
  readonly recipients: string;
  readonly ianaTimeZoneId: string;
  readonly dayOfWeek: number;
  readonly hourOfDay: number;
};

/** Friendly 12-hour label for digest send time (hour is 0–23 in tenant time zone). */
export function formatExecDigestSendTimeLabel(hour: number): string {
  const normalized: number = Number.isFinite(hour) ? Math.min(23, Math.max(0, Math.trunc(hour))) : 0;

  if (normalized === 0) {
    return "12:00 AM";
  }

  if (normalized < 12) {
    return `${normalized}:00 AM`;
  }

  if (normalized === 12) {
    return "12:00 PM";
  }

  return `${normalized - 12}:00 PM`;
}

export const EXEC_DIGEST_HOUR_OPTIONS: readonly { readonly value: number; readonly label: string }[] = Array.from(
  { length: 24 },
  (_, hour) => ({
    value: hour,
    label: formatExecDigestSendTimeLabel(hour),
  }),
);

export function parseExecDigestRecipientEmails(input: string): string[] {
  return input
    .split(/[;,\n]/g)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function validateExecDigestRecipientEmails(input: string): {
  readonly valid: boolean;
  readonly invalidAddresses: readonly string[];
  readonly duplicateAddresses: readonly string[];
  readonly unsupportedGroupMailboxes: readonly string[];
} {
  const addresses: string[] = parseExecDigestRecipientEmails(input);
  const invalidAddresses: string[] = addresses.filter((address) => !EMAIL_PATTERN.test(address));
  const duplicateAddresses: string[] = [];
  const seen = new Set<string>();

  for (const address of addresses) {
    const key = address.toLowerCase();

    if (seen.has(key)) {
      duplicateAddresses.push(address);
    }
    else {
      seen.add(key);
    }
  }

  const unsupportedGroupMailboxes: string[] = addresses.filter((address) =>
    /@.*\.(onmicrosoft|google|groups)\./i.test(address),
  );

  return {
    valid: invalidAddresses.length === 0 && duplicateAddresses.length === 0 && unsupportedGroupMailboxes.length === 0,
    invalidAddresses,
    duplicateAddresses,
    unsupportedGroupMailboxes,
  };
}

export function execDigestFormFromPreferences(prefs: ExecDigestPreferencesResponse): ExecDigestScheduleFormState {
  return {
    emailEnabled: prefs.emailEnabled,
    recipients: prefs.recipientEmails.join("; "),
    ianaTimeZoneId: prefs.ianaTimeZoneId,
    dayOfWeek: prefs.dayOfWeek,
    hourOfDay: prefs.hourOfDay,
  };
}

export function execDigestUpsertFromForm(form: ExecDigestScheduleFormState): ExecDigestPreferencesUpsertRequest {
  return {
    emailEnabled: form.emailEnabled,
    recipientEmails: parseExecDigestRecipientEmails(form.recipients),
    ianaTimeZoneId: form.ianaTimeZoneId.trim() || "UTC",
    dayOfWeek: form.dayOfWeek,
    hourOfDay: form.hourOfDay,
  };
}

function normalizedRecipientKey(input: string): string {
  return parseExecDigestRecipientEmails(input)
    .map((entry) => entry.toLowerCase())
    .sort()
    .join(",");
}

/**
 * True when the operator has edited the form away from what it was loaded with.
 *
 * Compares against the same baseline the form is seeded from — including the
 * browser-zone substitution for never-configured preferences. Comparing against raw
 * saved preferences instead reported an "Unsaved changes" badge on first paint for
 * every tenant outside UTC, because the seeded default itself looked like an edit.
 */
export function hasUnsavedExecDigestChanges(
  saved: ExecDigestPreferencesResponse | null,
  form: ExecDigestScheduleFormState,
): boolean {
  if (saved === null) {
    return false;
  }

  const baseline: ExecDigestScheduleFormState = execDigestFormFromPreferencesWithBrowserDefault(saved);

  return (
    baseline.emailEnabled !== form.emailEnabled ||
    baseline.ianaTimeZoneId !== form.ianaTimeZoneId ||
    baseline.dayOfWeek !== form.dayOfWeek ||
    baseline.hourOfDay !== form.hourOfDay ||
    normalizedRecipientKey(baseline.recipients) !== normalizedRecipientKey(form.recipients)
  );
}

export function isExecDigestScheduleFormValid(form: ExecDigestScheduleFormState): boolean {
  if (form.ianaTimeZoneId.trim().length === 0) {
    return false;
  }

  if (form.dayOfWeek < 0 || form.dayOfWeek > 6) {
    return false;
  }

  if (form.hourOfDay < 0 || form.hourOfDay > 23) {
    return false;
  }

  if (!form.emailEnabled) {
    return true;
  }

  const validation = validateExecDigestRecipientEmails(form.recipients);

  return validation.valid && parseExecDigestRecipientEmails(form.recipients).length > 0;
}

/** Human-readable cadence label for executive digest sends. */
export function formatExecDigestCadenceLabel(form: ExecDigestScheduleFormState): string {
  const dayName: string = EXEC_DIGEST_DAY_NAMES[form.dayOfWeek] ?? "—";
  const timeLabel: string = formatExecDigestSendTimeLabel(form.hourOfDay);

  return `${dayName} at ${timeLabel}`;
}

/** Customer sentence for the configured cadence (independent of active/paused). */
export function formatExecDigestConfiguredCadenceSentence(form: ExecDigestScheduleFormState): string {
  const dayName: string = EXEC_DIGEST_DAY_NAMES[form.dayOfWeek] ?? "—";
  const timeLabel: string = formatExecDigestSendTimeLabel(form.hourOfDay);
  const zoneLabel: string = formatIanaTimeZoneOptionLabel(form.ianaTimeZoneId);

  return `Every ${dayName} at ${timeLabel} ${zoneLabel}`;
}

export function formatExecDigestLiveScheduleSummary(
  form: ExecDigestScheduleFormState,
  isConfigured: boolean,
): string {
  const configured = formatExecDigestConfiguredCadenceSentence(form);

  if (!form.emailEnabled) {
    if (!isConfigured) {
      return configured;
    }

    return `Configured for ${configured.charAt(0).toLowerCase()}${configured.slice(1)}. Delivery is currently paused.`;
  }

  return configured;
}

type ZonedDateParts = {
  readonly year: number;
  readonly month: number;
  readonly day: number;
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

function getZonedDateParts(instant: Date, timeZoneId: string): ZonedDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZoneId,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(instant).map((part) => [part.type, part.value]));

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: weekdayFromShortName(parts.weekday ?? "Sun"),
  };
}

function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  timeZoneId: string,
): Date {
  const desiredAsUtcMs = Date.UTC(year, month - 1, day, hour, 0, 0);

  const offsetAt = (utcMs: number): number => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZoneId,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const parts = Object.fromEntries(formatter.formatToParts(new Date(utcMs)).map((part) => [part.type, part.value]));
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );

    return asUtc - utcMs;
  };

  let utcMs = desiredAsUtcMs - offsetAt(desiredAsUtcMs);
  utcMs = desiredAsUtcMs - offsetAt(utcMs);

  return new Date(utcMs);
}

/**
 * Next send instant for the configured local day/hour in `ianaTimeZoneId`.
 * Uses Intl offsets so daylight-saving transitions are not hard-coded.
 */
export function computeExecDigestNextSendInstant(
  form: Pick<ExecDigestScheduleFormState, "dayOfWeek" | "hourOfDay" | "ianaTimeZoneId">,
  from: Date = new Date(),
): Date | null {
  const timeZoneId = form.ianaTimeZoneId.trim() || "UTC";
  const fromParts = getZonedDateParts(from, timeZoneId);

  for (let offset = 0; offset < 14; offset += 1) {
    const probeUtc = new Date(Date.UTC(fromParts.year, fromParts.month - 1, fromParts.day + offset, 12, 0, 0));
    const probeParts = getZonedDateParts(probeUtc, timeZoneId);

    if (probeParts.weekday !== form.dayOfWeek) {
      continue;
    }

    const candidate = zonedWallTimeToUtc(
      probeParts.year,
      probeParts.month,
      probeParts.day,
      form.hourOfDay,
      timeZoneId,
    );

    if (candidate.getTime() > from.getTime()) {
      return candidate;
    }
  }

  return null;
}
export function formatExecDigestNextOccurrenceLabel(instant: Date, timeZoneId: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZoneId,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const parts = formatter.formatToParts(instant);
  const lookup = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${lookup("weekday")}, ${lookup("month")} ${lookup("day")} at ${lookup("hour")}:${lookup("minute")} ${lookup("dayPeriod")} ${lookup("timeZoneName")}`
    .replace(/\s+/g, " ")
    .trim();
}

/** Human-readable next-send line for saved schedule summaries. */
export function formatExecDigestNextSendPreview(
  form: ExecDigestScheduleFormState,
  isConfigured: boolean,
): string {
  if (!form.emailEnabled) {
    if (!isConfigured) {
      return "Not scheduled until delivery is enabled";
    }

    return "Not scheduled while delivery is paused";
  }

  const next = computeExecDigestNextSendInstant(form);

  if (next !== null) {
    return formatExecDigestNextOccurrenceLabel(next, form.ianaTimeZoneId);
  }

  const zoneLabel: string = formatIanaTimeZoneOptionLabel(form.ianaTimeZoneId);

  return `${formatExecDigestCadenceLabel(form)} (${zoneLabel})`;
}

export function resolveBrowserTimeZoneIdForExecDigest(): string {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone?.trim() ?? "";

    if (resolved.length > 0) {
      return resolved === "Etc/UTC" ? "UTC" : resolved;
    }
  } catch {
    /* Intl unavailable */
  }

  return "UTC";
}

/** Prefer the browser zone when preferences were never configured (API defaults to UTC). */
export function execDigestFormFromPreferencesWithBrowserDefault(
  prefs: ExecDigestPreferencesResponse,
): ExecDigestScheduleFormState {
  const base = execDigestFormFromPreferences(prefs);

  if (!prefs.isConfigured && (prefs.ianaTimeZoneId === "UTC" || prefs.ianaTimeZoneId.trim().length === 0)) {
    return {
      ...base,
      ianaTimeZoneId: resolveBrowserTimeZoneIdForExecDigest(),
    };
  }

  return base;
}

export function maskExecDigestRecipientForDisplay(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");

  if (at <= 1) {
    return "•••";
  }

  return `${trimmed.slice(0, 1)}•••${trimmed.slice(at)}`;
}
