import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("./use-impact-preview-baseline-availability", () => ({
  useImpactPreviewBaselineAvailability: () => ({ loading: false, finalizedCount: 2 }),
}));

vi.mock("./use-is-operator-nav-href-reachable", () => ({
  useIsOperatorNavHrefReachable: () => true,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { EvolutionReviewPageView } from "@/app/(operator)/insights/impact-preview/_sections/EvolutionReviewPageView";
import type { EvolutionReviewPageViewModel } from "@/app/(operator)/insights/impact-preview/_sections/evolution-review-view-model";
import {
  IMPACT_PREVIEW_PAGE_SUBTITLE,
  IMPACT_PREVIEW_PAGE_SUBTITLE_BUYER,
  IMPACT_PREVIEW_SCOPE_DETAILS_TRIGGER,
  IMPACT_PREVIEW_TRUST_NOTICE,
} from "@/lib/impact-preview-page-copy";
import { DEFAULT_IMPACT_PREVIEW_COMPARISON_SCOPE } from "@/lib/impact-preview-page-types";

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

describe("EvolutionReviewPageView buyer-polished shell", () => {
  it("uses buyer subtitle and collapses orientation and trust copy", () => {
    render(<EvolutionReviewPageView model={buildModel()} />);

    expect(screen.getByText(IMPACT_PREVIEW_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(IMPACT_PREVIEW_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-last-refreshed")).toHaveTextContent(/Not refreshed yet/i);
    expect(screen.queryByText(IMPACT_PREVIEW_SCOPE_DETAILS_TRIGGER)).toBeNull(); // TB-2093
    expect(screen.getByText(IMPACT_PREVIEW_TRUST_NOTICE)).toBeInTheDocument();
    expect(screen.queryByText(/How impact preview works/i)).not.toBeInTheDocument();
  });
});
