import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "", displayTitle: "" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: () => <div data-testid="ask-run-id-picker" />,
}));

import { PlanningPageView } from "@/app/(operator)/insights/improvement-planning/_sections/PlanningPageView";
import type { PlanningPageViewModel } from "@/app/(operator)/insights/improvement-planning/_sections/planning-page-view-model";

function buildModel(): PlanningPageViewModel {
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
  };
}

describe("PlanningPageView pick-review strip", () => {
  it("shows the pick-review strip when no review is selected", () => {
    render(<PlanningPageView model={buildModel()} />);

    expect(screen.getByTestId("planning-pick-review-before-planning-strip")).toBeInTheDocument();
  });
});
