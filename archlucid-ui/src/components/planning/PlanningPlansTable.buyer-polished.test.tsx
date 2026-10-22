import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

import { PlanningPlansTable } from "@/components/planning/PlanningPlansTable";
import { IMPROVEMENT_PLANNING_THEME_ID_LABEL } from "@/lib/planning-page-copy";
import type { LearningPlanListItemResponse } from "@/types/learning";

function buildPlan(overrides: Partial<LearningPlanListItemResponse> = {}): LearningPlanListItemResponse {
  return {
    planId: "plan-1",
    themeId: "theme-missing-title",
    title: "Reduce integration risk",
    summary: "Consolidate ingress paths.",
    status: "Proposed",
    priorityScore: 8,
    priorityExplanation: "High blast radius",
    createdUtc: "2026-07-01T12:00:00Z",
    ...overrides,
  };
}

describe("PlanningPlansTable buyer-polished shell", () => {
  it("discloses missing theme ids instead of rendering raw identifiers", () => {
    render(<PlanningPlansTable plans={[buildPlan()]} themeTitleById={new Map()} />);

    expect(screen.getByText(IMPROVEMENT_PLANNING_THEME_ID_LABEL)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show details" })).toBeInTheDocument();
    expect(screen.queryByText("theme-missing-title")).not.toBeInTheDocument();
  });
});
