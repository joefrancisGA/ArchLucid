import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  IMPACT_PREVIEW_EMPTY_NO_CANDIDATES_TITLE,
  IMPACT_PREVIEW_PAGE_TITLE,
} from "@/lib/impact-preview-page-copy";
import { DEFAULT_IMPACT_PREVIEW_COMPARISON_SCOPE } from "@/lib/impact-preview-page-types";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("./use-impact-preview-baseline-availability", () => ({
  useImpactPreviewBaselineAvailability: () => ({ loading: false, finalizedCount: 2 }),
}));

vi.mock("./use-is-operator-nav-href-reachable", () => ({
  useIsOperatorNavHrefReachable: () => true,
}));

import { EvolutionReviewPageView } from "./EvolutionReviewPageView";
import type { EvolutionReviewPageViewModel } from "./evolution-review-view-model";

function buildModel(overrides: Partial<EvolutionReviewPageViewModel> = {}): EvolutionReviewPageViewModel {
  return {
    isDemo: false,
    candidates: [],
    selectedId: null,
    setSelectedId: vi.fn(),
    selectedBaselineId: null,
    setSelectedBaselineId: vi.fn(),
    baselineOptions: [],
    comparisonScope: DEFAULT_IMPACT_PREVIEW_COMPARISON_SCOPE,
    toggleComparisonScope: vi.fn(),
    detail: null,
    listLoading: false,
    detailLoading: false,
    simulateBusy: false,
    listFailure: null,
    detailFailure: null,
    simulateFailure: null,
    loadList: vi.fn(),
    onSimulate: vi.fn(),
    planSnapshot: null,
    lastRefreshedAt: null,
    ...overrides,
  };
}

describe("EvolutionReviewPageView", () => {
  it("renders the refined header and output preview when no simulation exists", () => {
    render(
      <EvolutionReviewPageView
        model={buildModel({
          candidates: [
            {
              candidateChangeSetId: "candidate-1",
              sourcePlanId: "plan-1",
              status: "Ready",
              title: "Retire legacy integration",
              summary: "Consolidate ingress paths.",
              derivationRuleVersion: "v1",
              createdUtc: "2026-07-01T12:00:00Z",
            },
          ],
          selectedId: "candidate-1",
          baselineOptions: [{ runId: "run-1", label: "Claims intake baseline" }],
          selectedBaselineId: "run-1",
        })}
      />,
    );

    expect(screen.getByRole("heading", { name: IMPACT_PREVIEW_PAGE_TITLE, level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-setup-card")).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-output-preview")).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-simulate-button")).toBeInTheDocument();
    expect(screen.queryByText(/DevelopmentBypass/i)).not.toBeInTheDocument();
  });

  it("shows the no proposed changes empty state", () => {
    render(<EvolutionReviewPageView model={buildModel()} />);

    expect(screen.getByTestId("impact-preview-no-candidates-empty-state")).toBeInTheDocument();
    expect(screen.getByText(IMPACT_PREVIEW_EMPTY_NO_CANDIDATES_TITLE)).toBeInTheDocument();
    expect(screen.queryByTestId("impact-preview-setup-card")).not.toBeInTheDocument();
  });
});
