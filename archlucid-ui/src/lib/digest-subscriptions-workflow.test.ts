import { describe, expect, it } from "vitest";

import {
  activationCheckboxLabel,
  buildDigestSubscriptionReadinessSummary,
  isDuplicateEmailDestination,
  maskDigestDestination,
  shouldShowDigestTypeSelector,
  suggestedSubscriptionName,
} from "@/lib/digest-subscriptions-workflow";
import type { DigestSubscription } from "@/types/digest-subscriptions";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

function sampleSubscription(destination: string): DigestSubscription {
  return {
    subscriptionId: "s1",
    tenantId: "t",
    workspaceId: "w",
    projectId: "p",
    name: "Ops mailbox",
    channelType: "Email",
    destination,
    isEnabled: true,
    createdUtc: "2026-07-01T00:00:00Z",
    metadataJson: "{}",
  };
}

function sampleHealth(overrides: Partial<WeeklyDigestHealthDto> = {}): WeeklyDigestHealthDto {
  return {
    enabledAdvisoryScheduleCount: 1,
    digestSubscriptionCount: 1,
    enabledDigestSubscriptionCount: 1,
    digestSubscriptionsByEmailChannel: 1,
    digestSubscriptionsBySlackChannel: 0,
    digestSubscriptionsByTeamsChannel: 0,
    executiveEmailDigestIsConfigured: false,
    executiveEmailDigestEnabled: false,
    executiveDigestRecipientCount: 0,
    executiveDigestIanaTimeZoneId: "UTC",
    executiveDigestDayOfWeek: 1,
    executiveDigestHourOfDay: 9,
    setupGaps: [],
    ...overrides,
  };
}

describe("digest-subscriptions-workflow", () => {
  it("hides digest type selector when only one option exists", () => {
    expect(shouldShowDigestTypeSelector()).toBe(false);
  });

  it("uses behavior-accurate activation copy", () => {
    expect(activationCheckboxLabel(true)).toContain("Enable delivery after saving");
    expect(activationCheckboxLabel(false)).toContain("paused");
  });

  it("detects duplicate email destinations case-insensitively for active rows only", () => {
    const existing: DigestSubscription[] = [
      sampleSubscription("ops@example.com"),
      { ...sampleSubscription("paused@example.com"), subscriptionId: "s2", isEnabled: false },
    ];

    expect(isDuplicateEmailDestination(existing, "OPS@example.com")).toBe(true);
    expect(isDuplicateEmailDestination(existing, "paused@example.com")).toBe(false);
    expect(isDuplicateEmailDestination(existing, "other@example.com")).toBe(false);
  });

  it("masks destinations for read-only viewers", () => {
    expect(maskDigestDestination("ops@example.com", false)).toBe("o…@example.com");
    expect(maskDigestDestination("ops@example.com", true)).toBe("ops@example.com");
  });

  it("builds separate schedule and destination readiness rows", () => {
    const summary = buildDigestSubscriptionReadinessSummary(sampleHealth(), [sampleSubscription("ops@example.com")]);

    expect(summary.rows.some((row) => row.id === "destinations")).toBe(true);
    expect(summary.rows.some((row) => row.id === "schedule")).toBe(true);
    expect(summary.blockingIssue).toBeNull();
  });

  it("flags missing schedule as blocking issue with a single schedule link", () => {
    const summary = buildDigestSubscriptionReadinessSummary(
      sampleHealth({ enabledAdvisoryScheduleCount: 0 }),
      [],
    );

    expect(summary.blockingIssue).toMatch(/schedule/i);
    expect(summary.nextActionHref).toBe("/governance/advisory-scans?tab=schedules");
    const scheduleLinks = summary.rows.filter((row) => row.href === "/governance/advisory-scans?tab=schedules");
    expect(scheduleLinks).toHaveLength(1);
    expect(scheduleLinks[0]?.id).toBe("schedule");
  });

  it("suggests channel-aware delivery names", () => {
    expect(suggestedSubscriptionName("SlackWebhook")).toContain("Slack");
  });
});
