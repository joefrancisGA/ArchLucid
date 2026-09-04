import type { ExecDigestScheduleFormState } from "./exec-digest-schedule-form-state";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
