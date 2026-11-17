import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IMPROVEMENT_PLANNING_PAGE_TITLE } from "@/lib/planning-page-copy";
import { PLANNING_PLAN_DETAIL_PAGE_TITLE } from "@/lib/planning-plan-detail-evidence-copy";

import { ImprovementPlanningPlanDetailBreadcrumb } from "./ImprovementPlanningPlanDetailBreadcrumb";

describe("ImprovementPlanningPlanDetailBreadcrumb", () => {
  it("does not render a breadcrumb trail (TB-2090)", () => {
    render(<ImprovementPlanningPlanDetailBreadcrumb planLabel="Modernize intake workflow" />);

    expect(screen.queryByTestId("improvement-planning-plan-detail-breadcrumb")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Insights" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: IMPROVEMENT_PLANNING_PAGE_TITLE })).not.toBeInTheDocument();
    expect(screen.queryByText("Modernize intake workflow")).not.toBeInTheDocument();
  });

  it("does not render a fallback breadcrumb label (TB-2090)", () => {
    render(<ImprovementPlanningPlanDetailBreadcrumb />);

    expect(screen.queryByText(PLANNING_PLAN_DETAIL_PAGE_TITLE)).not.toBeInTheDocument();
  });
});
