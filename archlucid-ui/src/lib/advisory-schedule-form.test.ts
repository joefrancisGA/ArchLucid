import { describe, expect, it } from "vitest";

import {
  buildAdvisoryScheduleCronExpression,
  createDefaultAdvisoryScheduleFormState,
  describeStoredCronExpression,
  findNextLocalOccurrence,
  formatAdvisoryScheduleInstant,
  formatLocalClockLabel,
  resolveAdvisoryRunProjectSlug,
  resolveAdvisoryScheduleName,
  suggestedAdvisoryScheduleName,
  zonedWallTimeToUtc,
} from "@/lib/advisory-schedule-form";

describe("advisory-schedule-form", () => {
  it("builds a daily UTC cron from local Eastern time", () => {
    const form = {
      ...createDefaultAdvisoryScheduleFormState("America/New_York"),
      frequency: "daily" as const,
      hourOfDay: 7,
      minuteOfHour: 0,
    };
    const cron = buildAdvisoryScheduleCronExpression(form);
    const parts = cron.split(/\s+/);

    expect(parts).toHaveLength(5);
    expect(parts[0]).toBe("0");
    expect(Number(parts[1])).toBeGreaterThanOrEqual(11);
    expect(Number(parts[1])).toBeLessThanOrEqual(12);
    expect(parts[2]).toBe("*");
    expect(parts[3]).toBe("*");
    expect(parts[4]).toBe("*");
  });

  it("builds a weekly cron for the selected local weekday", () => {
    const form = {
      ...createDefaultAdvisoryScheduleFormState("UTC"),
      frequency: "weekly" as const,
      dayOfWeek: 1,
      hourOfDay: 8,
      minuteOfHour: 0,
      timeZoneId: "UTC",
    };

    expect(buildAdvisoryScheduleCronExpression(form)).toBe("0 8 * * 1");
  });

  it("builds a weekday cron", () => {
    const form = {
      ...createDefaultAdvisoryScheduleFormState("UTC"),
      frequency: "weekdays" as const,
      hourOfDay: 9,
      minuteOfHour: 30,
      timeZoneId: "UTC",
    };

    expect(buildAdvisoryScheduleCronExpression(form)).toBe("30 9 * * 1-5");
  });

  it("builds a monthly cron on day 1–28", () => {
    const form = {
      ...createDefaultAdvisoryScheduleFormState("UTC"),
      frequency: "monthly" as const,
      dayOfMonth: 15,
      hourOfDay: 6,
      minuteOfHour: 0,
      timeZoneId: "UTC",
    };

    expect(buildAdvisoryScheduleCronExpression(form)).toBe("0 6 15 * *");
  });

  it("passes custom cron through unchanged", () => {
    const form = {
      ...createDefaultAdvisoryScheduleFormState("UTC"),
      frequency: "custom" as const,
      customCron: "15 3 * * 2",
    };

    expect(buildAdvisoryScheduleCronExpression(form)).toBe("15 3 * * 2");
  });

  it("formats upcoming runs in the selected time zone", () => {
    const formatted = formatAdvisoryScheduleInstant("2026-07-21T11:00:00.000Z", "America/New_York");

    expect(formatted.primary).toMatch(/Tuesday/i);
    expect(formatted.primary).toMatch(/July/);
    expect(formatted.primary).toMatch(/7:00/);
    expect(formatted.utcSecondary).toContain("UTC");
  });

  it("handles DST spring-forward by using Intl offsets (no hard-coded hours)", () => {
    // 2026-03-08 is US spring-forward; 2:30 AM local does not exist — 1:30 AM EST and 3:30 AM EDT are valid.
    const before = zonedWallTimeToUtc(2026, 3, 8, 1, 30, "America/New_York");
    const after = zonedWallTimeToUtc(2026, 3, 8, 3, 30, "America/New_York");

    expect(before.toISOString()).toBe("2026-03-08T06:30:00.000Z");
    expect(after.toISOString()).toBe("2026-03-08T07:30:00.000Z");
  });

  it("finds the next local occurrence after a reference instant", () => {
    const from = new Date("2026-07-20T12:00:00.000Z");
    const next = findNextLocalOccurrence(
      {
        frequency: "daily",
        hourOfDay: 7,
        minuteOfHour: 0,
        timeZoneId: "UTC",
        dayOfWeek: 1,
        dayOfMonth: 1,
      },
      from,
    );

    expect(next.toISOString()).toBe("2026-07-21T07:00:00.000Z");
  });

  it("suggests a name from frequency and project without overwriting a touched name", () => {
    const form = {
      ...createDefaultAdvisoryScheduleFormState("UTC"),
      frequency: "weekly" as const,
      name: "My custom name",
      nameTouched: true,
    };

    expect(suggestedAdvisoryScheduleName(form, "claims-intake")).toMatch(/Weekly claims-intake/i);
    expect(resolveAdvisoryScheduleName(form, "claims-intake")).toBe("My custom name");
  });

  it("maps scope GUIDs to the default authority project key", () => {
    expect(resolveAdvisoryRunProjectSlug("33333333-3333-3333-3333-333333333333")).toBe("default");
    expect(resolveAdvisoryRunProjectSlug("claims-intake")).toBe("claims-intake");
    expect(resolveAdvisoryRunProjectSlug(null)).toBe("default");
  });

  it("describes stored cron expressions in plain language", () => {
    expect(describeStoredCronExpression("0 7 * * *")).toMatch(/Daily/i);
    expect(describeStoredCronExpression("0 8 * * 1")).toMatch(/Weekly/i);
    expect(describeStoredCronExpression("0 9 1 * *")).toMatch(/Monthly/i);
    expect(formatLocalClockLabel(7, 0)).toBe("7:00 AM");
  });
});
