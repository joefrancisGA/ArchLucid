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

const baselineAvailabilityMock = vi.fn(() => ({ loading: false, finalizedCount: 2 }));

vi.mock("./use-impact-preview-baseline-availability", () => ({
  useImpactPreviewBaselineAvailability: () => baselineAvailabilityMock(),
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
  IMPACT_PREVIEW_EMPTY_NO_BASELINE_TITLE,
  IMPACT_PREVIEW_ORIENTATION,
  IMPACT_PREVIEW_PAGE_SUBTITLE,
  IMPACT_PREVIEW_PAGE_SUBTITLE_BUYER,
  IMPACT_PREVIEW_SCOPE_DETAILS_TRIGGER,
  IMPACT_PREVIEW_TRUST_NOTICE,
} from "@/lib/impact-preview-page-copy";
import { IMPACT_PREVIEW_CLAIM_DISCIPLINE_HEADING } from "@/lib/impact-preview-evidence-copy";
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
    loadDetail: vi.fn(),
    onSimulate: vi.fn(),
    planSnapshot: null,
    lastRefreshedAt: null,
    ...overrides,
  };
}

describe("EvolutionReviewPageView buyer-polished shell", () => {
  it("uses buyer subtitle and collapses orientation and trust copy when ready", () => {
    baselineAvailabilityMock.mockReturnValue({ loading: false, finalizedCount: 2 });

    render(
      <EvolutionReviewPageView
        model={buildModel({
          lastRefreshedAt: new Date("2026-07-09T12:00:00.000Z"),
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
        })}
      />,
    );

    expect(screen.getByText(IMPACT_PREVIEW_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(IMPACT_PREVIEW_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(IMPACT_PREVIEW_CLAIM_DISCIPLINE_HEADING)).toBeInTheDocument();
    expect(screen.queryByTestId("impact-preview-compare-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-last-refreshed")).toHaveTextContent(/Last refreshed:/i);
    expect(screen.queryByText(IMPACT_PREVIEW_SCOPE_DETAILS_TRIGGER)).toBeNull();
    expect(screen.queryByText(IMPACT_PREVIEW_TRUST_NOTICE)).not.toBeInTheDocument();
    expect(screen.getByText(IMPACT_PREVIEW_ORIENTATION)).toBeInTheDocument();
    expect(screen.queryByText(/How impact preview works/i)).not.toBeInTheDocument();
  });

  it("keeps the no-baseline blocked surface compact in buyer-polished shell", () => {
    baselineAvailabilityMock.mockReturnValue({ loading: false, finalizedCount: 0 });

    render(<EvolutionReviewPageView model={buildModel()} />);

    expect(screen.getByText(IMPACT_PREVIEW_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByText(IMPACT_PREVIEW_EMPTY_NO_BASELINE_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-output-preview")).toBeInTheDocument();
    expect(screen.queryByText(IMPACT_PREVIEW_ORIENTATION)).not.toBeInTheDocument();
    expect(screen.queryByText(IMPACT_PREVIEW_TRUST_NOTICE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-capability-boundary")).not.toBeInTheDocument();
  });
});
