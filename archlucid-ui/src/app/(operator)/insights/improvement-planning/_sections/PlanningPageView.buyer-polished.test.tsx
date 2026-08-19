import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

import { PlanningPageView } from "@/app/(operator)/insights/improvement-planning/_sections/PlanningPageView";
import type { PlanningPageViewModel } from "@/app/(operator)/insights/improvement-planning/_sections/planning-page-view-model";
import {
  IMPROVEMENT_PLANNING_PAGE_SUBTITLE_BUYER,
  IMPROVEMENT_PLANNING_SCOPE_DETAILS_TRIGGER,
} from "@/lib/planning-page-copy";
import { PLANNING_CLAIM_DISCIPLINE_HEADING } from "@/lib/planning-evidence-copy";

vi.mock("@/components/planning/PlanningExportReadinessNote", () => ({
  PlanningExportReadinessNote: () => null,
}));

function buildModel(overrides: Partial<PlanningPageViewModel> = {}): PlanningPageViewModel {
  return {
    isDemo: false,
    summary: {
      generatedUtc: "2026-01-01T00:00:00.000Z",
      themeCount: 1,
      planCount: 1,
      totalThemeEvidenceSignals: 1,
      totalLinkedSignalsAcrossPlans: 1,
      maxPlanPriorityScore: 1,
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
    empty: false,
    ...overrides,
  };
}

describe("PlanningPageView buyer-polished shell", () => {
  it("uses buyer subtitle and collapses duplicate intro copy", () => {
    render(<PlanningPageView model={buildModel()} />);

    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("improvement-planning-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("improvement-planning-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(PLANNING_CLAIM_DISCIPLINE_HEADING)).toBeInTheDocument();
    expect(screen.queryByTestId("planning-reviews-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("planning-plan-detail-hub-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByText(IMPROVEMENT_PLANNING_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(/Planning insights are generated from captured review feedback/i)).not.toBeInTheDocument();
    expect(screen.queryByText(IMPROVEMENT_PLANNING_SCOPE_DETAILS_TRIGGER)).toBeNull(); // TB-2093
    expect(screen.queryByText(/Technical scope details/i)).not.toBeInTheDocument();
  });
});
