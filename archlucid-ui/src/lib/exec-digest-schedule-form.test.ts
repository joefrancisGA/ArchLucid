import { describe, expect, it } from "vitest";

import {
  formatExecDigestNextSendPreview,
  formatExecDigestSendTimeLabel,
  hasUnsavedExecDigestChanges,
  parseExecDigestRecipientEmails,
  validateExecDigestRecipientEmails,
} from "@/lib/exec-digest-schedule-form";
import type { ExecDigestPreferencesResponse } from "@/types/exec-digest-preferences";

function prefs(overrides: Partial<ExecDigestPreferencesResponse> = {}): ExecDigestPreferencesResponse {
  return {
    schemaVersion: 1,
    tenantId: "t",
    isConfigured: true,
    emailEnabled: true,
    recipientEmails: ["ops@example.com"],
    ianaTimeZoneId: "UTC",
    dayOfWeek: 1,
    hourOfDay: 8,
    updatedUtc: "2026-07-08T12:00:00Z",
    ...overrides,
  };
}

describe("exec-digest-schedule-form", () => {
  it("formats friendly send times", () => {
    expect(formatExecDigestSendTimeLabel(8)).toBe("8:00 AM");
    expect(formatExecDigestSendTimeLabel(0)).toBe("12:00 AM");
    expect(formatExecDigestSendTimeLabel(13)).toBe("1:00 PM");
  });

  it("parses comma and semicolon recipient separators", () => {
    expect(parseExecDigestRecipientEmails("a@x.com; b@x.com, c@x.com")).toEqual([
      "a@x.com",
      "b@x.com",
      "c@x.com",
    ]);
  });

  it("validates recipient emails", () => {
    expect(validateExecDigestRecipientEmails("bad").valid).toBe(false);
    expect(validateExecDigestRecipientEmails("ops@example.com").valid).toBe(true);
  });

  it("detects unsaved changes", () => {
    const saved = prefs();
    expect(
      hasUnsavedExecDigestChanges(saved, {
        emailEnabled: true,
        recipients: "ops@example.com",
        ianaTimeZoneId: "UTC",
        dayOfWeek: 1,
        hourOfDay: 8,
      }),
    ).toBe(false);
    expect(
      hasUnsavedExecDigestChanges(saved, {
        emailEnabled: false,
        recipients: "ops@example.com",
        ianaTimeZoneId: "UTC",
        dayOfWeek: 1,
        hourOfDay: 8,
      }),
    ).toBe(true);
  });

  it("formats next send preview", () => {
    expect(
      formatExecDigestNextSendPreview({
        emailEnabled: false,
        recipients: "",
        ianaTimeZoneId: "UTC",
        dayOfWeek: 1,
        hourOfDay: 8,
      }),
    ).toBe("Not scheduled");
    expect(
      formatExecDigestNextSendPreview({
        emailEnabled: true,
        recipients: "ops@example.com",
        ianaTimeZoneId: "UTC",
        dayOfWeek: 1,
        hourOfDay: 8,
      }),
    ).toBe("Monday at 8:00 AM (UTC)");
  });

  it("rejects duplicate recipients when enabled", () => {
    expect(validateExecDigestRecipientEmails("ops@example.com; ops@example.com").valid).toBe(false);
  });
});
