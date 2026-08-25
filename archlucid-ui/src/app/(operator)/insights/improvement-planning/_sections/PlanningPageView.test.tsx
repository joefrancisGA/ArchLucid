import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

import { PlanningPageView } from "@/app/(operator)/insights/improvement-planning/_sections/PlanningPageView";
import type { PlanningPageViewModel } from "@/app/(operator)/insights/improvement-planning/_sections/planning-page-view-model";
import {
  IMPROVEMENT_PLANNING_CAPTURE_FEEDBACK_CTA,
  IMPROVEMENT_PLANNING_EMPTY_TITLE,
  IMPROVEMENT_PLANNING_EXPORT_SECTION_TITLE,
  IMPROVEMENT_PLANNING_LOAD_RETRY_LABEL,
  IMPROVEMENT_PLANNING_PAGE_TITLE,
  IMPROVEMENT_PLANNING_REFRESH_LABEL,
  IMPROVEMENT_PLANNING_THEMES_EMPTY_MESSAGE,
} from "@/lib/planning-page-copy";
import {
  IMPROVEMENT_PLANNING_EMPTY_OUTCOME_TITLE,
  IMPROVEMENT_PLANNING_PRIORITY_EXPLAIN,
} from "@/lib/planning-empty-orientation-copy";

vi.mock("@/components/planning/PlanningExportReadinessNote", () => ({
  PlanningExportReadinessNote: () => <aside data-testid="planning-export-section">{IMPROVEMENT_PLANNING_EXPORT_SECTION_TITLE}</aside>,
}));

vi.mock("./PlanningPickReviewBeforePlanningStrip", () => ({
  PlanningPickReviewBeforePlanningStrip: () => null,
}));

function buildModel(overrides: Partial<PlanningPageViewModel> = {}): PlanningPageViewModel {
  return {
    isDemo: false,
    summary: {
      generatedUtc: "2026-01-01T00:00:00.000Z",
      themeCount: 0,
      planCount: 0,
      totalThemeEvidenceSignals: 0,
      totalLinkedSignalsAcrossPlans: 0,
      maxPlanPriorityScore: null,
    },
    sortedThemes: [],
    sortedPlans: [],
    themeTitleById: new Map(),
    visiblePlans: [],
    selectedThemeId: null,
    setSelectedThemeId: vi.fn(),
    selectedThemeTitle: null,
    generatedUtc: "2026-01-01T00:00:00.000Z",
    loading: false,
    refreshing: false,
    failure: null,
    usedPlanningDemoFallback: false,
    load: vi.fn(async () => undefined),
    empty: true,
    ...overrides,
  };
}

describe("PlanningPageView", () => {
  it("uses improvement planning product copy and a visible refresh action", () => {
    render(<PlanningPageView model={buildModel()} />);

    expect(screen.getByRole("heading", { name: IMPROVEMENT_PLANNING_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(/Convert review feedback into recurring themes/i)).toBeInTheDocument();
    expect(screen.getByText(/Planning insights are generated from captured review feedback/i)).toBeInTheDocument();
    expect(screen.getByTestId("planning-header-actions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: IMPROVEMENT_PLANNING_REFRESH_LABEL })).toBeInTheDocument();
    expect(screen.getByTestId("planning-last-updated")).toBeInTheDocument();
    expect(screen.queryByText(/GET \/v1\/learning\/report/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Download JSON/i)).not.toBeInTheDocument();
  });

  it("shows a guided empty state with feedback capture actions", () => {
    render(<PlanningPageView model={buildModel()} />);

    expect(screen.getByText(IMPROVEMENT_PLANNING_EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: IMPROVEMENT_PLANNING_CAPTURE_FEEDBACK_CTA })).toHaveAttribute(
      "href",
      "/internal/product-learning",
    );
    expect(screen.getByText(IMPROVEMENT_PLANNING_EMPTY_OUTCOME_TITLE)).toBeInTheDocument();
    expect(screen.getByText(IMPROVEMENT_PLANNING_PRIORITY_EXPLAIN)).toBeInTheDocument();
    expect(screen.queryByText(IMPROVEMENT_PLANNING_THEMES_EMPTY_MESSAGE)).not.toBeInTheDocument();
    expect(screen.queryByText("No feedback signals captured yet")).not.toBeInTheDocument();
    expect(screen.queryByText(IMPROVEMENT_PLANNING_EXPORT_SECTION_TITLE)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Top improvement themes" })).not.toBeInTheDocument();
  });

  it("shows summary themes plans and priority explain when data exists", () => {
    render(
      <PlanningPageView
        model={buildModel({
          empty: false,
          summary: {
            generatedUtc: "2026-01-01T00:00:00.000Z",
            themeCount: 1,
            planCount: 1,
            totalThemeEvidenceSignals: 3,
            totalLinkedSignalsAcrossPlans: 2,
            maxPlanPriorityScore: 42,
          },
          sortedThemes: [
            {
              themeId: "theme-1",
              themeKey: "evidence-completeness",
              title: "Evidence completeness",
              summary: "Recurring gap",
              evidenceSignalCount: 3,
              affectedArtifactTypeOrWorkflowArea: "Reviews",
              severityBand: "High",
              distinctRunCount: 2,
              derivationRuleVersion: "v1",
              status: "Active",
              createdUtc: "2026-01-01T00:00:00.000Z",
            },
          ],
          sortedPlans: [
            {
              planId: "plan-1",
              themeId: "theme-1",
              title: "Improve evidence completeness",
              summary: "Close the gap",
              priorityScore: 42,
              status: "Draft",
              createdUtc: "2026-01-01T00:00:00.000Z",
            },
          ],
          visiblePlans: [
            {
              planId: "plan-1",
              themeId: "theme-1",
              title: "Improve evidence completeness",
              summary: "Close the gap",
              priorityScore: 42,
              status: "Draft",
              createdUtc: "2026-01-01T00:00:00.000Z",
            },
          ],
          themeTitleById: new Map([["theme-1", "Evidence completeness"]]),
        })}
      />,
    );

    expect(screen.getByRole("heading", { name: "Top improvement themes" })).toBeInTheDocument();
    expect(screen.getByTestId("planning-priority-explain")).toHaveTextContent(IMPROVEMENT_PLANNING_PRIORITY_EXPLAIN);
    expect(screen.getByTestId("planning-export-section")).toBeInTheDocument();
    expect(screen.queryByText(IMPROVEMENT_PLANNING_EMPTY_TITLE)).not.toBeInTheDocument();
  });

  it("offers retry when planning insights fail to load", () => {
    const load = vi.fn(async () => undefined);

    render(
      <PlanningPageView
        model={buildModel({
          failure: {
            message: "Could not load planning insights.",
            problem: null,
            correlationId: null,
            httpStatus: 503,
            retryAfterSeconds: null,
          },
          load,
        })}
      />,
    );

    expect(screen.getByTestId("planning-load-failure")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("planning-load-retry"));

    expect(load).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: IMPROVEMENT_PLANNING_LOAD_RETRY_LABEL })).toBeInTheDocument();
  });
});
