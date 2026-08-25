import { describe, expect, it } from "vitest";

import { resolveContinueLastAdvisorySchedule } from "@/lib/resolve-continue-last-advisory-schedule";
import type { AdvisoryScanSchedule } from "@/types/advisory-scheduling";

function schedule(overrides: Partial<AdvisoryScanSchedule> = {}): AdvisoryScanSchedule {
  return {
    scheduleId: "sched-1",
    tenantId: "t1",
    workspaceId: "w1",
    projectId: "p1",
    runProjectSlug: "default",
    name: "Weekly advisory scan",
    cronExpression: "0 8 * * 1",
    isEnabled: true,
    createdUtc: "2026-08-01T00:00:00.000Z",
    nextRunUtc: "2026-08-31T08:00:00.000Z",
    lastRunUtc: "2026-08-24T08:00:00.000Z",
    ...overrides,
  };
}

describe("resolveContinueLastAdvisorySchedule", () => {
  it("falls back to the soonest next scan when no stored id exists", () => {
    const match = resolveContinueLastAdvisorySchedule([
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
