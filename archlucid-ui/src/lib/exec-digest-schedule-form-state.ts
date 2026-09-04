import type { ExecDigestPreferencesResponse, ExecDigestPreferencesUpsertRequest } from "@/types/exec-digest-preferences";

import { parseExecDigestRecipientEmails } from "./exec-digest-schedule-validation";
import { resolveBrowserTimeZoneIdForExecDigest } from "./exec-digest-schedule-options";

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
