import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PLANNING_PLAN_DETAIL_PAGE_SUBTITLE_BUYER } from "@/lib/planning-plan-detail-evidence-copy";

vi.mock("next/navigation", () => ({
  usePathname: () => "/insights/improvement-planning/plans/demo-plan",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { PlanningPlanDetailPageHeader } from "@/app/(operator)/insights/improvement-planning/plans/[planId]/_sections/PlanningPlanDetailPageHeader";

describe("PlanningPlanDetailPageHeader", () => {
  it("renders h2, breadcrumb, help, refresh, and created metadata", () => {
    const onRefresh = vi.fn();

    render(
      <PlanningPlanDetailPageHeader
        subtitle={PLANNING_PLAN_DETAIL_PAGE_SUBTITLE_BUYER}
        planId="demo-plan"
        planLabel="Modernize intake workflow"
        createdUtc="2026-01-01T00:00:00.000Z"
        refreshing={false}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Improvement plan" })).toBeInTheDocument();
    expect(screen.getByText(PLANNING_PLAN_DETAIL_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("improvement-planning-plan-detail-breadcrumb")).toBeInTheDocument();
    expect(screen.getByText("Modernize intake workflow")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
