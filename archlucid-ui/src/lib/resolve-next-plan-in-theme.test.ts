import { describe, expect, it } from "vitest";

import { resolveNextPlanInTheme } from "@/lib/resolve-next-plan-in-theme";
import type { LearningPlanListItemResponse } from "@/types/learning";

function plan(overrides: Partial<LearningPlanListItemResponse> = {}): LearningPlanListItemResponse {
  return {
    planId: "plan-1",
    themeId: "theme-1",
    title: "Plan one",
    summary: "Summary",
    priorityScore: 10,
    status: "open",
    createdUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("resolveNextPlanInTheme", () => {
  it("returns the next plan in theme priority order", () => {
    const next = resolveNextPlanInTheme(
      [
        plan({ planId: "plan-1", priorityScore: 20 }),
        plan({ planId: "plan-2", title: "Plan two", priorityScore: 10 }),
      ],
      "plan-1",
      "theme-1",
    );

    expect(next?.planId).toBe("plan-2");
  });

  it("breaks equal priorities by creation instant", () => {
    const plans = [
      plan({ planId: "earlier", createdUtc: "2026-05-01T13:00:00+02:00" }),
      plan({ planId: "later", createdUtc: "2026-05-01T12:00:00Z" }),
      plan({ planId: "unknown", createdUtc: "unreadable" }),
    ];

    expect(resolveNextPlanInTheme(plans, "earlier", "theme-1")?.planId).toBe("later");
    expect(resolveNextPlanInTheme(plans, "later", "theme-1")?.planId).toBe("unknown");
  });

  it("returns null when current plan is last in theme", () => {
    expect(resolveNextPlanInTheme([plan()], "plan-1", "theme-1")).toBeNull();
  });
});
