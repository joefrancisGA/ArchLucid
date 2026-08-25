import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanningPlanDetailNextPlanFooter } from "./PlanningPlanDetailNextPlanFooter";

describe("PlanningPlanDetailNextPlanFooter", () => {
  it("renders next plan link", () => {
    render(
      <PlanningPlanDetailNextPlanFooter
        plan={{
          planId: "plan-2",
          themeId: "theme-1",
          title: "Harden ingress controls",
          summary: "Summary",
          priorityScore: 8,
          status: "open",
          createdUtc: "2026-01-02T00:00:00Z",
        }}
      />,
    );

    expect(screen.getByTestId("planning-plan-detail-next-plan-footer")).toBeInTheDocument();
    expect(screen.getByTestId("planning-plan-detail-next-plan-action")).toHaveAttribute(
      "href",
      "/insights/improvement-planning/plans/plan-2",
    );
  });
});
