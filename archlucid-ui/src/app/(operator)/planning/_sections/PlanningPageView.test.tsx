import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

import { PlanningPageView } from "@/app/(operator)/planning/_sections/PlanningPageView";
import type { PlanningPageViewModel } from "@/app/(operator)/planning/_sections/planning-page-view-model";
import {
  IMPROVEMENT_PLANNING_CAPTURE_FEEDBACK_CTA,
  IMPROVEMENT_PLANNING_EMPTY_TITLE,
  IMPROVEMENT_PLANNING_EXPORT_SECTION_TITLE,
  IMPROVEMENT_PLANNING_PAGE_TITLE,
  IMPROVEMENT_PLANNING_REFRESH_LABEL,
  IMPROVEMENT_PLANNING_THEMES_EMPTY_MESSAGE,
} from "@/lib/planning-page-copy";

vi.mock("@/components/planning/PlanningExportReadinessNote", () => ({
  PlanningExportReadinessNote: () => <aside data-testid="planning-export-section">{IMPROVEMENT_PLANNING_EXPORT_SECTION_TITLE}</aside>,
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
      "/product-learning",
    );
    expect(screen.getByText(IMPROVEMENT_PLANNING_THEMES_EMPTY_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText("No feedback signals captured yet")).toBeInTheDocument();
  });
});
