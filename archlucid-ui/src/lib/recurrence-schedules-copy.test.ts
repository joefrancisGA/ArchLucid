import { describe, expect, it } from "vitest";

import { buildRecurrenceLocalTimeSummary } from "@/lib/recurrence-local-time";
import {
  RECURRENCE_SCHEDULE_EXAMPLES,
  RECURRENCE_SCHEDULES_EMPTY_DESCRIPTION,
  RECURRENCE_SCHEDULES_HELPER_BODY,
  RECURRENCE_SCHEDULES_HOW_IT_WORKS_BODY,
} from "@/lib/recurrence-schedules-copy";

/** Rough five-field cron shape — used to ensure human cadence is not a raw cron string. */
const CRON_LIKE = /^\d+\s+\d+\s+/;

describe("RECURRENCE_SCHEDULE_EXAMPLES (TB-1132)", () => {
  it("leads with human cadence and keeps cron as a separate secondary field", () => {
    expect(RECURRENCE_SCHEDULE_EXAMPLES.length).toBeGreaterThan(0);

    for (const example of RECURRENCE_SCHEDULE_EXAMPLES) {
      expect(example.humanCadence.length).toBeGreaterThan(0);
      expect(example.humanCadence).not.toMatch(CRON_LIKE);
      expect(example.cronExpression.trim().length).toBeGreaterThan(0);
      expect(example.cronExpression).toMatch(CRON_LIKE);
    }
  });

  it("pins authored humanCadence to derived UTC cadence for every preset", () => {
    for (const example of RECURRENCE_SCHEDULE_EXAMPLES) {
      const summary = buildRecurrenceLocalTimeSummary({
        cronExpression: example.cronExpression,
        ianaTimeZoneId: "America/New_York",
        referenceUtc: "2026-07-20T12:00:00.000Z",
      });

      expect(example.humanCadence).toBe(summary.utcSecondary);
    }
  });
});

describe("recurrence schedules page copy (P0-5)", () => {
  it("states due-date effect and prerequisite without non-canonical nouns", () => {
    expect(RECURRENCE_SCHEDULES_EMPTY_DESCRIPTION).toMatch(/follow-up architecture review/i);
    expect(RECURRENCE_SCHEDULES_EMPTY_DESCRIPTION).toMatch(/finalized architecture review/i);
    expect(RECURRENCE_SCHEDULES_HOW_IT_WORKS_BODY).toMatch(/follow-up architecture review/i);
    expect(RECURRENCE_SCHEDULES_HOW_IT_WORKS_BODY).toMatch(/finalized architecture reviews/i);
    expect(RECURRENCE_SCHEDULES_HOW_IT_WORKS_BODY).not.toMatch(/committed architecture records/i);
    expect(RECURRENCE_SCHEDULES_HELPER_BODY).toMatch(/not configured on this page/i);
  });
});
