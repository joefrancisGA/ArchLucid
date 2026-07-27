import { describe, expect, it } from "vitest";

import { RECURRENCE_SCHEDULE_EXAMPLES } from "@/lib/recurrence-schedules-copy";

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
});
