import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
  usePathname: () => "/insights/improvement-planning/plans/demo-plan",
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { PlanningPlanDetailPageView } from "@/app/(operator)/insights/improvement-planning/plans/[planId]/_sections/PlanningPlanDetailPageView";
import type { UsePlanningPlanDetailPageModel } from "@/app/(operator)/insights/improvement-planning/plans/[planId]/_sections/use-planning-plan-detail-page";

function buildModel(overrides: Partial<UsePlanningPlanDetailPageModel> = {}): UsePlanningPlanDetailPageModel {
  return {
    failure: null,
    loading: false,
    plan: null,
    planId: "demo-plan",
    ...overrides,
  };
}

describe("PlanningPlanDetailPageView", () => {
  it("renders unified load failure with retry", () => {
    render(
      <PlanningPlanDetailPageView
        model={buildModel({
          failure: {
            message: "Unable to load plan",
            problem: null,
            correlationId: null,
            httpStatus: null,
            retryAfterSeconds: null,
          },
        })}
      />,
    );

    expect(screen.getByTestId("planning-plan-detail-load-failure")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("planning-plan-detail-load-retry"));
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("renders claim orientation and plan sections when loaded", () => {
    render(
      <PlanningPlanDetailPageView
        model={buildModel({
          plan: {
            planId: "demo-plan",
            themeId: "theme-a",
            title: "Modernize intake workflow",
            summary: "Reduce manual intake steps.",
            priorityScore: 8,
            priorityExplanation: null,
            status: "open",
            createdUtc: "2026-01-01T00:00:00.000Z",
            createdByUserId: null,
            actionSteps: [],
            evidenceCounts: {
              linkedSignalCount: 1,
              linkedArtifactCount: 0,
              linkedArchitectureRunCount: 2,
            },
            theme: null,
          },
        })}
      />,
    );

    expect(screen.getByTestId("planning-plan-detail-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("planning-plan-detail-status")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Modernize intake workflow" })).toBeInTheDocument();
  });
});
