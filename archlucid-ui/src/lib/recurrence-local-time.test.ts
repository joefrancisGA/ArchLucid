import { describe, expect, it } from "vitest";

import {
  buildRecurrenceLocalTimeSummary,
  findRepresentativeUtcInstantForCron,
  formatRecurrenceInstantLocalFirst,
} from "@/lib/recurrence-local-time";

describe("buildRecurrenceLocalTimeSummary (TB-2210)", () => {
  it("paraphrases weekly Monday 08:00 UTC into Eastern local time", () => {
    const summary = buildRecurrenceLocalTimeSummary({
      cronExpression: "0 8 * * 1",
      ianaTimeZoneId: "America/New_York",
      referenceUtc: "2026-07-20T12:00:00.000Z",
    });

    expect(summary.isUtcZone).toBe(false);
    expect(summary.utcSecondary).toMatch(/Monday/i);
    expect(summary.utcSecondary).toMatch(/08:00 UTC/);
    // 08:00 UTC Monday in July is 04:00 AM EDT Monday
    expect(summary.localPrimary).toMatch(/Monday/i);
    expect(summary.localPrimary).toMatch(/4:00 AM/i);
    expect(summary.localPrimary).toMatch(/America\/New_York/);
  });

  it("keeps a single UTC line when the display zone is UTC", () => {
    const summary = buildRecurrenceLocalTimeSummary({
      cronExpression: "0 8 * * 1",
      ianaTimeZoneId: "UTC",
      referenceUtc: "2026-07-20T12:00:00.000Z",
    });

    expect(summary.isUtcZone).toBe(true);
    expect(summary.localPrimary).toMatch(/Monday/i);
    expect(summary.localPrimary).toMatch(/08:00 UTC/);
    expect(summary.utcSecondary).toBe("");
  });

  it("describes daily 07:00 UTC in Tokyo", () => {
    const summary = buildRecurrenceLocalTimeSummary({
      cronExpression: "0 7 * * *",
      ianaTimeZoneId: "Asia/Tokyo",
      referenceUtc: "2026-07-20T12:00:00.000Z",
    });

    expect(summary.utcSecondary).toMatch(/Daily/i);
    expect(summary.utcSecondary).toMatch(/07:00 UTC/);
    // 07:00 UTC is 16:00 in Tokyo (no DST)
    expect(summary.localPrimary).toMatch(/4:00 PM/i);
    expect(summary.localPrimary).toMatch(/Asia\/Tokyo/);
  });

  it("uses nextRunUtc when provided for five-field cron paraphrase", () => {
    const summary = buildRecurrenceLocalTimeSummary({
      cronExpression: "0 8 * * 1",
      nextRunUtc: "2026-07-27T08:00:00.000Z",
      ianaTimeZoneId: "America/Chicago",
    });

    expect(summary.localPrimary).toMatch(/America\/Chicago/);
    expect(summary.utcSecondary).toMatch(/08:00 UTC/);
  });

  it("handles @hourly without inventing a wall-clock day", () => {
    const summary = buildRecurrenceLocalTimeSummary({
      cronExpression: "@hourly",
      ianaTimeZoneId: "America/Los_Angeles",
    });

    expect(summary.utcSecondary).toMatch(/hour/i);
    expect(summary.localPrimary.toLowerCase()).toContain("hour");
  });
});

describe("findRepresentativeUtcInstantForCron", () => {
  it("finds the next Monday 08:00 UTC after the reference", () => {
    const instant = findRepresentativeUtcInstantForCron("0 8 * * 1", "2026-07-20T12:00:00.000Z");

    expect(instant).not.toBeNull();
    expect(instant!.toISOString()).toBe("2026-07-27T08:00:00.000Z");
  });
});

describe("formatRecurrenceInstantLocalFirst", () => {
  it("shows Eastern primary and UTC secondary", () => {
    const summary = formatRecurrenceInstantLocalFirst(
      "2026-07-21T11:00:00.000Z",
      "America/New_York",
    );

    expect(summary.localPrimary).toMatch(/Tuesday/i);
    expect(summary.localPrimary).toMatch(/7:00/);
    expect(summary.utcSecondary).toContain("UTC");
  });

  it("returns an em dash for empty instants", () => {
    const summary = formatRecurrenceInstantLocalFirst(null, "UTC");

    expect(summary.localPrimary).toBe("\u2014");
  });
});
