import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IMPROVEMENT_PLANNING_PAGE_TITLE } from "@/lib/planning-page-copy";
import { PLANNING_PLAN_DETAIL_PAGE_TITLE } from "@/lib/planning-plan-detail-evidence-copy";

import { ImprovementPlanningPlanDetailBreadcrumb } from "./ImprovementPlanningPlanDetailBreadcrumb";

describe("ImprovementPlanningPlanDetailBreadcrumb", () => {
  it("renders insights trail ending on the plan title when provided", () => {
    render(<ImprovementPlanningPlanDetailBreadcrumb planLabel="Modernize intake workflow" />);

    expect(screen.getByTestId("improvement-planning-plan-detail-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Insights" })).toHaveAttribute("href", "/insights/evidence-graph");
    expect(screen.getByRole("link", { name: IMPROVEMENT_PLANNING_PAGE_TITLE })).toHaveAttribute(
      "href",
      "/insights/improvement-planning",
    );
    expect(screen.getByText("Modernize intake workflow")).toBeInTheDocument();
  });

  it("falls back to Improvement plan when no plan label is available", () => {
    render(<ImprovementPlanningPlanDetailBreadcrumb />);

    expect(screen.getByText(PLANNING_PLAN_DETAIL_PAGE_TITLE)).toBeInTheDocument();
  });
});
