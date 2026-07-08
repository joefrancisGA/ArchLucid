import { describe, expect, it } from "vitest";

import {
  digestsHaveExistingConfiguration,
  formatDigestInstant,
  mapDigestSetupGap,
  mapDigestSetupGaps,
  resolveDigestOverallStatus,
} from "@/lib/digest-setup-gap-actions";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

function baseSnap(overrides: Partial<WeeklyDigestHealthDto> = {}): WeeklyDigestHealthDto {
  return {
    enabledAdvisoryScheduleCount: 0,
    digestSubscriptionCount: 0,
    enabledDigestSubscriptionCount: 0,
    digestSubscriptionsByEmailChannel: 0,
    digestSubscriptionsBySlackChannel: 0,
    digestSubscriptionsByTeamsChannel: 0,
    executiveEmailDigestIsConfigured: false,
    executiveEmailDigestEnabled: false,
    executiveDigestRecipientCount: 0,
    executiveDigestIanaTimeZoneId: "UTC",
    executiveDigestDayOfWeek: 1,
    executiveDigestHourOfDay: 8,
    setupGaps: [],
    ...overrides,
  };
}

describe("digest-setup-gap-actions", () => {
  it("maps advisory schedule gap to Open schedules", () => {
    const action = mapDigestSetupGap(
      "No enabled advisory scan schedule — weekly architecture digests will not be generated on a cadence.",
    );

    expect(action.title).toBe("No advisory scan schedule");
    expect(action.impact).toContain("not be generated automatically");
    expect(action.actionLabel).toBe("Open schedules");
    expect(action.href).toBe("/advisory?tab=schedules");
  });

  it("maps subscription and executive gaps", () => {
    const mapped = mapDigestSetupGaps([
      "No digest subscriptions — generated digests have no outbound recipients in this scope.",
      "Executive email digest is not fully configured — sponsor emails will not receive the separate executive rollup.",
    ]);

    expect(mapped[0]?.actionLabel).toBe("Create subscription");
    expect(mapped[0]?.href).toBe("/digests?tab=subscriptions");
    expect(mapped[1]?.actionLabel).toBe("Configure schedule");
    expect(mapped[1]?.href).toBe("/digests?tab=schedule");
  });

  it("resolves overall status kinds", () => {
    expect(resolveDigestOverallStatus(baseSnap()).kind).toBe("blocked");
    expect(
      resolveDigestOverallStatus(
        baseSnap({
          enabledAdvisoryScheduleCount: 1,
          enabledDigestSubscriptionCount: 1,
          executiveEmailDigestEnabled: true,
        }),
      ).kind,
    ).toBe("ready");
    expect(
      resolveDigestOverallStatus(
        baseSnap({
          enabledAdvisoryScheduleCount: 1,
          setupGaps: ["gap"],
        }),
      ).kind,
    ).toBe("needs-attention");
  });

  it("detects existing configuration", () => {
    expect(digestsHaveExistingConfiguration(baseSnap())).toBe(false);
    expect(digestsHaveExistingConfiguration(baseSnap({ digestSubscriptionCount: 2 }))).toBe(true);
  });

  it("formats instants or em dash", () => {
    expect(formatDigestInstant(null)).toBe("—");
    expect(formatDigestInstant("not-a-date")).toBe("—");
    expect(formatDigestInstant("2026-07-08T12:00:00Z")).not.toBe("—");
  });
});
