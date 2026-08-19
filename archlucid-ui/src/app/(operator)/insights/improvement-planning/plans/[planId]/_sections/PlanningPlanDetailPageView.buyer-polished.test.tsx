import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
  usePathname: () => "/insights/improvement-planning/plans/demo-plan",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { PlanningPlanDetailPageView } from "@/app/(operator)/insights/improvement-planning/plans/[planId]/_sections/PlanningPlanDetailPageView";
import type { UsePlanningPlanDetailPageModel } from "@/app/(operator)/insights/improvement-planning/plans/[planId]/_sections/use-planning-plan-detail-page";
import {
  PLANNING_PLAN_DETAIL_CLAIM_HEADING,
  PLANNING_PLAN_DETAIL_PAGE_SUBTITLE_BUYER,
} from "@/lib/planning-plan-detail-evidence-copy";

function buildModel(overrides: Partial<UsePlanningPlanDetailPageModel> = {}): UsePlanningPlanDetailPageModel {
  return {
    failure: null,
    loading: false,
    plan: null,
    planId: "demo-plan",
    ...overrides,
  };
}

describe("PlanningPlanDetailPageView buyer-polished shell", () => {
  it("hides vocabulary rails and mounts claim orientation in buyer shell", () => {
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

    expect(screen.getByText(PLANNING_PLAN_DETAIL_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("improvement-planning-plan-detail-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("planning-plan-detail-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(PLANNING_PLAN_DETAIL_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.queryByTestId("planning-plan-detail-hub-vocabulary")).not.toBeInTheDocument();
  });
});
