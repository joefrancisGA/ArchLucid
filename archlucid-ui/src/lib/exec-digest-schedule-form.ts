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

export function hasUnsavedExecDigestChanges(
  saved: ExecDigestPreferencesResponse | null,
  form: ExecDigestScheduleFormState,
): boolean {
  if (saved === null) {
    return false;
  }

  return (
    saved.emailEnabled !== form.emailEnabled ||
    saved.ianaTimeZoneId !== form.ianaTimeZoneId ||
    saved.dayOfWeek !== form.dayOfWeek ||
    saved.hourOfDay !== form.hourOfDay ||
    normalizedRecipientKey(saved.recipientEmails.join("; ")) !== normalizedRecipientKey(form.recipients)
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

/** Human-readable next-send line for saved schedule summaries. */
export function formatExecDigestNextSendPreview(form: ExecDigestScheduleFormState): string {
  if (!form.emailEnabled) {
    return "Not scheduled";
  }

  const zoneLabel: string = formatIanaTimeZoneOptionLabel(form.ianaTimeZoneId);

  return `${formatExecDigestCadenceLabel(form)} (${zoneLabel})`;
}
