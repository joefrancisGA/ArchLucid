import { describe, expect, it } from "vitest";

import {
  computeExecDigestNextSendInstant,
  formatExecDigestConfiguredCadenceSentence,
  formatExecDigestLiveScheduleSummary,
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

  it("formats next send preview and paused cadence language", () => {
    expect(
      formatExecDigestNextSendPreview({
        emailEnabled: false,
        recipients: "",
        ianaTimeZoneId: "UTC",
        dayOfWeek: 1,
        hourOfDay: 8,
      }),
    ).toBe("Not scheduled while delivery is paused");

    expect(
      formatExecDigestConfiguredCadenceSentence({
        emailEnabled: false,
        recipients: "",
        ianaTimeZoneId: "UTC",
        dayOfWeek: 1,
        hourOfDay: 8,
      }),
    ).toMatch(/Every Monday at 8:00 AM UTC/i);

    expect(
      formatExecDigestLiveScheduleSummary({
        emailEnabled: false,
        recipients: "ops@example.com",
        ianaTimeZoneId: "UTC",
        dayOfWeek: 1,
        hourOfDay: 8,
      }),
    ).toMatch(/Delivery is currently paused/i);

    const activePreview = formatExecDigestNextSendPreview({
      emailEnabled: true,
      recipients: "ops@example.com",
      ianaTimeZoneId: "UTC",
      dayOfWeek: 1,
      hourOfDay: 8,
    });
    expect(activePreview).toMatch(/Monday/i);
    expect(activePreview).toMatch(/8:00/);
  });

  it("computes the next local send across a DST spring-forward week", () => {
    // Sunday 2026-03-08 is US spring-forward; next Monday 08:00 Eastern should still resolve.
    const from = new Date("2026-03-07T12:00:00.000Z");
    const next = computeExecDigestNextSendInstant(
      {
        dayOfWeek: 1,
        hourOfDay: 8,
        ianaTimeZoneId: "America/New_York",
      },
      from,
    );

    expect(next).not.toBeNull();
    expect(next!.toISOString()).toBe("2026-03-09T12:00:00.000Z");
  });

  it("rejects duplicate recipients when enabled", () => {
    expect(validateExecDigestRecipientEmails("ops@example.com; ops@example.com").valid).toBe(false);
  });
});
