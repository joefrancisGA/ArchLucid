import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IMPROVEMENT_PLANNING_PAGE_TITLE } from "@/lib/planning-page-copy";

import { ImprovementPlanningBreadcrumb } from "./ImprovementPlanningBreadcrumb";

describe("ImprovementPlanningBreadcrumb", () => {
  it("renders insights trail ending on Improvement planning", () => {
    render(<ImprovementPlanningBreadcrumb />);

    expect(screen.getByTestId("improvement-planning-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Insights" })).toHaveAttribute("href", "/insights/evidence-graph");
    expect(screen.getByText(IMPROVEMENT_PLANNING_PAGE_TITLE)).toBeInTheDocument();
  });
});
