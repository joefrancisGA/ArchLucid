import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanningContinueLastPlanRow } from "./PlanningContinueLastPlanRow";

describe("PlanningContinueLastPlanRow", () => {
  it("links to the plan detail page", () => {
    render(
      <PlanningContinueLastPlanRow
        plan={{
          planId: "plan-42",
          themeId: "theme-1",
          title: "Reduce PHI exposure",
          summary: "",
          priorityScore: 3,
          status: "Open",
          createdUtc: "2026-08-01T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByTestId("planning-continue-last-plan-open")).toHaveAttribute(
      "href",
      "/insights/improvement-planning/plans/plan-42",
    );
  });
});
