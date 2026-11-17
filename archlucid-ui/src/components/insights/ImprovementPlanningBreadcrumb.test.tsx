import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IMPROVEMENT_PLANNING_PAGE_TITLE } from "@/lib/planning-page-copy";

import { ImprovementPlanningBreadcrumb } from "./ImprovementPlanningBreadcrumb";

describe("ImprovementPlanningBreadcrumb", () => {
  it("defers to page titles after TB-2090 breadcrumb removal", () => {
    render(<ImprovementPlanningBreadcrumb />);

    expect(screen.queryByTestId("improvement-planning-breadcrumb")).not.toBeInTheDocument();
    expect(IMPROVEMENT_PLANNING_PAGE_TITLE.length).toBeGreaterThan(0);
  });
});
