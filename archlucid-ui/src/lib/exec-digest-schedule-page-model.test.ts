import { describe, expect, it } from "vitest";

import {
  buildExecDigestDeliveryReadiness,
  buildExecDigestSavedScheduleSummary,
  resolveExecDigestStatus,
} from "@/lib/exec-digest-schedule-page-model";
import type { ExecDigestPreferencesResponse } from "@/types/exec-digest-preferences";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

const basePrefs: ExecDigestPreferencesResponse = {
  schemaVersion: 1,
  tenantId: "tenant-1",
  isConfigured: true,
  emailEnabled: true,
  recipientEmails: ["ops@example.com"],
  ianaTimeZoneId: "UTC",
  dayOfWeek: 1,
  hourOfDay: 8,
  updatedUtc: "2026-07-08T12:00:00Z",
};

const baseHealth: WeeklyDigestHealthDto = {
  enabledAdvisoryScheduleCount: 1,
  digestSubscriptionCount: 1,
  enabledDigestSubscriptionCount: 1,
  digestSubscriptionsByEmailChannel: 1,
  digestSubscriptionsBySlackChannel: 0,
  digestSubscriptionsByTeamsChannel: 0,
  executiveEmailDigestIsConfigured: true,
  executiveEmailDigestEnabled: true,
  executiveDigestRecipientCount: 1,
  executiveDigestIanaTimeZoneId: "UTC",
  executiveDigestDayOfWeek: 1,
  executiveDigestHourOfDay: 8,
  setupGaps: [],
};

describe("exec-digest-schedule-page-model", () => {
  it("resolves off, active, paused, and setup-required states", () => {
    const form = {
      emailEnabled: false,
      recipients: "",
      ianaTimeZoneId: "UTC",
      dayOfWeek: 1,
      hourOfDay: 8,
    };

    expect(resolveExecDigestStatus({ ...basePrefs, isConfigured: false, emailEnabled: false }, form, false).kind).toBe(
      "off",
    );
    expect(resolveExecDigestStatus({ ...basePrefs, emailEnabled: false }, form, false).kind).toBe("paused");
    expect(resolveExecDigestStatus(basePrefs, { ...form, emailEnabled: true, recipients: "ops@example.com" }, false).kind).toBe(
      "active",
    );
    expect(resolveExecDigestStatus(basePrefs, { ...form, emailEnabled: true, recipients: "" }, true).kind).toBe(
      "setup-required",
    );
  });

  it("builds saved schedule summary with direct and subscription recipient counts", () => {
    const summary = buildExecDigestSavedScheduleSummary(basePrefs, baseHealth);

    expect(summary.statusLabel).toBe("Active");
    expect(summary.directRecipientCount).toBe(1);
    expect(summary.subscriptionRecipientCount).toBe(1);
    expect(summary.nextScheduledSend).toContain("Monday");
  });

  it("shows only delivery-blocking readiness items for the schedule tab", () => {
    const form = {
      emailEnabled: true,
      recipients: "",
      ianaTimeZoneId: "UTC",
      dayOfWeek: 1,
      hourOfDay: 8,
    };

    const items = buildExecDigestDeliveryReadiness(
      basePrefs,
      form,
      {
        ...baseHealth,
        setupGaps: ["Outbound email channel is not ready for production delivery."],
      },
      true,
    );

    expect(items.some((item) => item.id === "recipient-readiness" && item.blocking)).toBe(true);
    expect(items.some((item) => item.id === "outbound-email" && item.blocking)).toBe(true);
    expect(items.some((item) => item.label === "No advisory scan schedule")).toBe(false);
  });
});
