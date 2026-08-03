import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanningPlanDetailSourcesStrip } from "@/app/(operator)/planning/plans/[planId]/_sections/PlanningPlanDetailSourcesStrip";
import {
  PLANNING_PLAN_DETAIL_PATH_PREFIX,
  PLANNING_PLAN_DETAIL_SOURCES,
} from "@/lib/planning-plan-detail-evidence-copy";

describe("PlanningPlanDetailSourcesStrip", () => {
  it("lists follow-up Sources without self-linking plan detail", () => {
    render(<PlanningPlanDetailSourcesStrip />);

    expect(screen.getByTestId("planning-plan-detail-sources")).toBeInTheDocument();
    expect(screen.getByTestId("planning-plan-detail-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(/derived from captured review feedback/i)).toBeInTheDocument();

    const sources = screen.getByTestId("planning-plan-detail-sources");

    for (const link of PLANNING_PLAN_DETAIL_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      PLANNING_PLAN_DETAIL_SOURCES.some((link) => link.href.startsWith(PLANNING_PLAN_DETAIL_PATH_PREFIX)),
    ).toBe(false);
  });
});
