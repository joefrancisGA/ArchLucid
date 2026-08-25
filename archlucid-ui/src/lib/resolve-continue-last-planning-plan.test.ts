import { describe, expect, it } from "vitest";

import { resolveContinueLastPlanningPlan } from "@/lib/resolve-continue-last-planning-plan";

describe("resolveContinueLastPlanningPlan", () => {
  it("returns the plan with the latest createdUtc", () => {
    const plan = resolveContinueLastPlanningPlan([
      {
        planId: "older",
        themeId: "theme-1",
        title: "Older plan",
        summary: "",
        priorityScore: 1,
        status: "Open",
        createdUtc: "2026-01-01T00:00:00.000Z",
      },
      {
        planId: "newer",
        themeId: "theme-1",
        title: "Newer plan",
        summary: "",
        priorityScore: 2,
        status: "Open",
        createdUtc: "2026-08-01T00:00:00.000Z",
      },
    ]);

    expect(plan?.planId).toBe("newer");
  });
});
