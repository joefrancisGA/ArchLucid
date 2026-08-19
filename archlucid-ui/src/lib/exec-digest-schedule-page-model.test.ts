import { describe, expect, it } from "vitest";

import {
  buildExecDigestDeliveryReadiness,
  buildExecDigestRecipientSummary,
  buildExecDigestSavedScheduleSummary,
  formatExecDigestNextSendLabel,
  formatExecDigestOutboundEmailStatusLabel,
  resolveExecDigestOutboundEmailStatus,
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
  it("resolves off, active, paused, and setup-incomplete states", () => {
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
      "setup-incomplete",
    );
  });

  it("builds saved schedule summary with configured cadence while paused", () => {
    const summary = buildExecDigestSavedScheduleSummary(
      { ...basePrefs, emailEnabled: false },
      baseHealth,
    );

    expect(summary.deliveryStatus).toBe("Paused");
    expect(summary.configuredCadence).toMatch(/Every Monday/i);
    expect(summary.nextScheduledSend).toMatch(/paused/i);
    expect(summary.directRecipientCount).toBe(1);
    expect(summary.subscriptionDestinationCount).toBe(1);
  });

  it("does not use paused language for next send when never configured", () => {
    const form = {
      emailEnabled: false,
      recipients: "",
      ianaTimeZoneId: "UTC",
      dayOfWeek: 1,
      hourOfDay: 8,
    };

    expect(formatExecDigestNextSendLabel(form, false)).toMatch(/until delivery is enabled/i);
    expect(formatExecDigestNextSendLabel(form, false)).not.toMatch(/paused/i);
  });

  it("summarizes direct recipients and subscription destinations separately", () => {
    expect(buildExecDigestRecipientSummary(2, 3)).toBe("2 direct, 3 subscription");
  });

  it("reports outbound email as not verified when health is unknown", () => {
    expect(resolveExecDigestOutboundEmailStatus(null)).toBe("not-verified");
    expect(formatExecDigestOutboundEmailStatusLabel("not-verified")).toBe("Not verified");

    const form = {
      emailEnabled: true,
      recipients: "ops@example.com",
      ianaTimeZoneId: "UTC",
      dayOfWeek: 1,
      hourOfDay: 8,
    };

    const unknownHealth = buildExecDigestDeliveryReadiness(basePrefs, form, null, false);
    const outbound = unknownHealth.items.find((item) => item.id === "outbound-email");

    expect(outbound?.value).toBe("Not verified");
    expect(outbound?.blocking).toBe(false);
    expect(unknownHealth.overallLabel).toBe("Verifying delivery");
  });

  it("builds readiness overall states including delivery issues", () => {
    const form = {
      emailEnabled: true,
      recipients: "",
      ianaTimeZoneId: "UTC",
      dayOfWeek: 1,
      hourOfDay: 8,
    };

    const incomplete = buildExecDigestDeliveryReadiness(basePrefs, form, baseHealth, true);
    expect(incomplete.overall).toBe("setup-incomplete");
    expect(incomplete.nextAction).toMatch(/Add at least one recipient/i);

    const issue = buildExecDigestDeliveryReadiness(
      basePrefs,
      { ...form, recipients: "ops@example.com" },
      {
        ...baseHealth,
        setupGaps: ["Outbound email channel is not ready for production delivery."],
      },
      false,
    );
    expect(issue.overall).toBe("delivery-issue");
    expect(issue.items.some((item) => item.id === "outbound-email" && item.blocking)).toBe(true);

    const ready = buildExecDigestDeliveryReadiness(
      basePrefs,
      { ...form, recipients: "ops@example.com" },
      baseHealth,
      false,
    );
    expect(ready.overall).toBe("ready");
  });
});
