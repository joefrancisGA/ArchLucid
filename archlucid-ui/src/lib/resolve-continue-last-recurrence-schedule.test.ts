import { describe, expect, it } from "vitest";

import type { ArchitectureReviewRecurrenceSchedule } from "@/lib/api/governance-stickiness-api";
import { resolveContinueLastRecurrenceSchedule } from "@/lib/resolve-continue-last-recurrence-schedule";

function schedule(
  overrides: Partial<ArchitectureReviewRecurrenceSchedule> = {},
): ArchitectureReviewRecurrenceSchedule {
  return {
    scheduleId: "sched-1",
    sourceRunId: "run-1",
    name: "Weekly review",
    cronExpression: "0 8 * * 1",
    isEnabled: true,
    nextRunUtc: "2026-08-31T08:00:00.000Z",
    lastTriggeredUtc: "2026-08-24T08:00:00.000Z",
    ...overrides,
  };
}

describe("resolveContinueLastRecurrenceSchedule", () => {
  it("returns null when input is not an array", () => {
    expect(resolveContinueLastRecurrenceSchedule(null)).toBeNull();
    expect(resolveContinueLastRecurrenceSchedule({})).toBeNull();
    expect(resolveContinueLastRecurrenceSchedule("nope")).toBeNull();
    expect(resolveContinueLastRecurrenceSchedule([])).toBeNull();
  });

  it("falls back to the soonest next run when no stored id exists", () => {
    const match = resolveContinueLastRecurrenceSchedule([
      schedule({
        scheduleId: "later",
        name: "Later",
        nextRunUtc: "2026-09-07T08:00:00.000Z",
      }),
      schedule({
        scheduleId: "sooner",
        name: "Sooner",
        nextRunUtc: "2026-08-26T08:00:00.000Z",
      }),
    ]);

    expect(match?.scheduleId).toBe("sooner");
    expect(match?.name).toBe("Sooner");
  });
});
