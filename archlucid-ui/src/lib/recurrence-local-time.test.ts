import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildRecurrenceLocalTimeSummary,
  findRepresentativeUtcInstantForCron,
  formatRecurrenceInstantLocalFirst,
} from "@/lib/recurrence-local-time";
import { RECURRENCE_SCHEDULE_EXAMPLES } from "@/lib/recurrence-schedules-copy";

const SUMMER_REFERENCE = "2026-07-20T12:00:00.000Z";
const WINTER_REFERENCE = "2026-12-20T12:00:00.000Z";

describe("buildRecurrenceLocalTimeSummary (TB-2210)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(SUMMER_REFERENCE));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("paraphrases weekly Monday 08:00 UTC into Eastern local time with DST basis", () => {
    const summary = buildRecurrenceLocalTimeSummary({
      cronExpression: "0 8 * * 1",
      ianaTimeZoneId: "America/New_York",
      referenceUtc: SUMMER_REFERENCE,
    });

    expect(summary.isUtcZone).toBe(false);
    expect(summary.utcSecondary).toBe("Weekly on Monday at 08:00 UTC");
    expect(summary.localPrimary).toMatch(/Monday/i);
    expect(summary.localPrimary).toMatch(/4:00 AM EDT/i);
    expect(summary.localPrimary).toMatch(/Eastern Daylight Time/);
    expect(summary.localOffsetBasis).toMatch(/Shifts to .* during EST\./);
  });

  it("keeps a single UTC line when the display zone is UTC", () => {
    const summary = buildRecurrenceLocalTimeSummary({
      cronExpression: "0 8 * * 1",
      ianaTimeZoneId: "UTC",
      referenceUtc: SUMMER_REFERENCE,
    });

    expect(summary.isUtcZone).toBe(true);
    expect(summary.localPrimary).toBe("Weekly on Monday at 08:00 UTC");
    expect(summary.utcSecondary).toBe("");
    expect(summary.localOffsetBasis).toBeUndefined();
  });

  it("describes daily 07:00 UTC in Tokyo without DST basis", () => {
    const summary = buildRecurrenceLocalTimeSummary({
      cronExpression: "0 7 * * *",
      ianaTimeZoneId: "Asia/Tokyo",
      referenceUtc: SUMMER_REFERENCE,
    });

    expect(summary.utcSecondary).toBe("Daily at 07:00 UTC");
    expect(summary.localPrimary).toMatch(/4:00 PM/i);
    expect(summary.localPrimary).toMatch(/Japan Standard Time/);
    expect(summary.localOffsetBasis).toBeUndefined();
  });

  it("uses nextRunUtc when provided for five-field cron paraphrase", () => {
    const summary = buildRecurrenceLocalTimeSummary({
      cronExpression: "0 8 * * 1",
      nextRunUtc: "2026-07-27T08:00:00.000Z",
      ianaTimeZoneId: "America/Chicago",
    });

    expect(summary.localPrimary).toMatch(/Central Daylight Time/);
    expect(summary.utcSecondary).toBe("Weekly on Monday at 08:00 UTC");
  });

  it("handles @hourly without inventing a wall-clock day", () => {
    const summary = buildRecurrenceLocalTimeSummary({
      cronExpression: "@hourly",
      ianaTimeZoneId: "America/Los_Angeles",
    });

    expect(summary.utcSecondary).toMatch(/hour/i);
    expect(summary.localPrimary.toLowerCase()).toContain("hour");
  });

  describe("preset cadence expressions (P0-1 / P0-2)", () => {
    const cases = [
      {
        title: "Quarterly control validation",
        cronExpression: "0 8 1 */3 *",
        utc: "Quarterly on the 1st at 08:00 UTC",
        summerLocal: /Quarterly on the 1st at 4:00 AM EDT/i,
        winterLocal: /Quarterly on the 1st at 3:00 AM EST/i,
        expectsOffsetBasis: true,
      },
      {
        title: "Annual policy attestation",
        cronExpression: "0 8 1 1 *",
        utc: "Annually on January 1 at 08:00 UTC",
        summerLocal: /Annually on January 1 at 3:00 AM EST/i,
        winterLocal: /Annually on January 1 at 3:00 AM EST/i,
        expectsOffsetBasis: false,
      },
      {
        title: "Post-remediation follow-up",
        cronExpression: "0 8 * * 1",
        utc: "Weekly on Monday at 08:00 UTC",
        summerLocal: /Weekly on Monday at 4:00 AM EDT/i,
        winterLocal: /Weekly on Monday at 3:00 AM EST/i,
        expectsOffsetBasis: true,
      },
      {
        title: "Architecture board review cadence",
        cronExpression: "0 8 1 * *",
        utc: "Monthly on the 1st at 08:00 UTC",
        summerLocal: /Monthly on the 1st at 4:00 AM EDT/i,
        winterLocal: /Monthly on the 1st at 3:00 AM EST/i,
        expectsOffsetBasis: true,
      },
    ] as const;

    it.each(cases)("classifies $title UTC cadence correctly", ({ cronExpression, utc }) => {
      const summary = buildRecurrenceLocalTimeSummary({
        cronExpression,
        ianaTimeZoneId: "America/New_York",
        referenceUtc: SUMMER_REFERENCE,
      });

      expect(summary.utcSecondary).toBe(utc);
    });

    it.each(cases)(
      "renders summer and winter local labels for $title",
      ({ cronExpression, summerLocal, winterLocal, expectsOffsetBasis }) => {
        const summer = buildRecurrenceLocalTimeSummary({
          cronExpression,
          ianaTimeZoneId: "America/New_York",
          referenceUtc: SUMMER_REFERENCE,
        });
        const winter = buildRecurrenceLocalTimeSummary({
          cronExpression,
          ianaTimeZoneId: "America/New_York",
          referenceUtc: WINTER_REFERENCE,
        });

        expect(summer.localPrimary).toMatch(summerLocal);
        expect(winter.localPrimary).toMatch(winterLocal);

        if (expectsOffsetBasis) {
          expect(summer.localOffsetBasis?.length ?? 0).toBeGreaterThan(0);
        } else {
          expect(summer.localOffsetBasis).toBeUndefined();
        }
      },
    );

    it("pins preset authored copy to derived UTC lines", () => {
      for (const example of RECURRENCE_SCHEDULE_EXAMPLES) {
        const summary = buildRecurrenceLocalTimeSummary({
          cronExpression: example.cronExpression,
          ianaTimeZoneId: "America/New_York",
          referenceUtc: SUMMER_REFERENCE,
        });

        expect(summary.utcSecondary).toBe(example.humanCadence);
      }
    });
  });

  it("notes browser-sniffed zones in the local cadence label", () => {
    const summary = buildRecurrenceLocalTimeSummary({
      cronExpression: "0 8 1 * *",
      ianaTimeZoneId: "America/New_York",
      referenceUtc: SUMMER_REFERENCE,
    });

    expect(summary.localPrimary).toMatch(/America\/New_York\)/);

    const browserSummary = buildRecurrenceLocalTimeSummary({
      cronExpression: "0 8 1 * *",
      referenceUtc: SUMMER_REFERENCE,
    });

    expect(browserSummary.localPrimary).toMatch(/from your browser/);
  });
});

describe("findRepresentativeUtcInstantForCron", () => {
  it("finds the next Monday 08:00 UTC after the reference", () => {
    const instant = findRepresentativeUtcInstantForCron("0 8 * * 1", SUMMER_REFERENCE);

    expect(instant).not.toBeNull();
    expect(instant!.toISOString()).toBe("2026-07-27T08:00:00.000Z");
  });

  it("finds January 1 for the annual preset after a summer reference", () => {
    const instant = findRepresentativeUtcInstantForCron("0 8 1 1 *", SUMMER_REFERENCE);

    expect(instant).not.toBeNull();
    expect(instant!.toISOString()).toBe("2027-01-01T08:00:00.000Z");
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
