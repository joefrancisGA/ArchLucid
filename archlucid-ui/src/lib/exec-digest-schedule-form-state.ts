import type { ExecDigestPreferencesResponse, ExecDigestPreferencesUpsertRequest } from "@/types/exec-digest-preferences";

import { DEFAULT_IANA_TIME_ZONE_ID } from "@/lib/default-iana-time-zone";

import { parseExecDigestRecipientEmails } from "./exec-digest-schedule-validation";

export type ExecDigestScheduleFormState = {
  readonly emailEnabled: boolean;
  readonly recipients: string;
  readonly ianaTimeZoneId: string;
  readonly dayOfWeek: number;
  readonly hourOfDay: number;
};

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
    ianaTimeZoneId: form.ianaTimeZoneId.trim() || DEFAULT_IANA_TIME_ZONE_ID,
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
 * product-default zone substitution for never-configured preferences.
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

/** Prefer the product default zone when preferences were never configured. */
export function execDigestFormFromPreferencesWithBrowserDefault(
  prefs: ExecDigestPreferencesResponse,
): ExecDigestScheduleFormState {
  const base = execDigestFormFromPreferences(prefs);

  if (!prefs.isConfigured && (prefs.ianaTimeZoneId === DEFAULT_IANA_TIME_ZONE_ID || prefs.ianaTimeZoneId.trim().length === 0)) {
    return {
      ...base,
      ianaTimeZoneId: DEFAULT_IANA_TIME_ZONE_ID,
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
