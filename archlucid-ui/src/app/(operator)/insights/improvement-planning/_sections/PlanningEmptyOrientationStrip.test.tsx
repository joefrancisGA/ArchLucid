import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanningEmptyOrientationStrip } from "@/app/(operator)/insights/improvement-planning/_sections/PlanningEmptyOrientationStrip";
import {
  IMPROVEMENT_PLANNING_EMPTY_OUTCOME_TITLE,
  IMPROVEMENT_PLANNING_MATURITY_STAGE_FEEDBACK,
  IMPROVEMENT_PLANNING_MATURITY_TITLE,
  IMPROVEMENT_PLANNING_PRIORITY_EXPLAIN,
} from "@/lib/planning-empty-orientation-copy";

describe("PlanningEmptyOrientationStrip", () => {
  it("teaches maturity, outcome sections, and priority without sample tenant data", () => {
    render(<PlanningEmptyOrientationStrip />);

    expect(screen.getByTestId("planning-empty-orientation")).toBeInTheDocument();
    expect(screen.getByText(IMPROVEMENT_PLANNING_MATURITY_TITLE)).toBeInTheDocument();
    expect(screen.getByText(IMPROVEMENT_PLANNING_MATURITY_STAGE_FEEDBACK)).toBeInTheDocument();
    expect(screen.getByText(IMPROVEMENT_PLANNING_EMPTY_OUTCOME_TITLE)).toBeInTheDocument();
    expect(screen.getByText(IMPROVEMENT_PLANNING_PRIORITY_EXPLAIN)).toBeInTheDocument();
    expect(screen.queryByText(/Security \(12\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Example/i)).not.toBeInTheDocument();
  });
});
