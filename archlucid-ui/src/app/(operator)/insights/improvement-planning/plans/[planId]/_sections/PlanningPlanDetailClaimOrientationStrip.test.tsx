import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanningPlanDetailClaimOrientationStrip } from "@/app/(operator)/insights/improvement-planning/plans/[planId]/_sections/PlanningPlanDetailClaimOrientationStrip";
import {
  PLANNING_PLAN_DETAIL_CLAIM_DISCIPLINE,
  PLANNING_PLAN_DETAIL_CLAIM_HEADING,
  PLANNING_PLAN_DETAIL_SOURCES_INTRO,
} from "@/lib/planning-plan-detail-evidence-copy";

describe("PlanningPlanDetailClaimOrientationStrip", () => {
  it("mounts claim discipline and sources for plan detail", () => {
    render(<PlanningPlanDetailClaimOrientationStrip />);

    expect(screen.getByTestId("planning-plan-detail-orientation")).toBeInTheDocument();
    expect(screen.getByText(PLANNING_PLAN_DETAIL_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(PLANNING_PLAN_DETAIL_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.getByText(PLANNING_PLAN_DETAIL_SOURCES_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId("planning-plan-detail-sources")).toBeInTheDocument();
  });
});
