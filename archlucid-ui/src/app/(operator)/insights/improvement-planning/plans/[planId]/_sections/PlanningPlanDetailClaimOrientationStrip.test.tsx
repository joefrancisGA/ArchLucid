import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanningPlanDetailClaimOrientationStrip } from "./PlanningPlanDetailClaimOrientationStrip";

describe("PlanningPlanDetailClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<PlanningPlanDetailClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("planning-plan-detail-sources")).toBeInTheDocument();
  });
});
