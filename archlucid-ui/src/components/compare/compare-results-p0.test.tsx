import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CompareResultsPanel } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanel";
import { CompareComparisonTrustBanner } from "@/components/compare/CompareComparisonTrustBanner";
import { CompareVerdictSummary } from "@/components/compare/CompareVerdictSummary";
import type { GoldenManifestComparison } from "@/types/comparison";

vi.mock("@/app/(operator)/insights/compare-two-reviews/_sections/useCompareGovernanceDiff", () => ({
  useCompareGovernanceDiff: () => ({
    loading: false,
    view: {
      usesCurrentEffectiveOnly: true,
      baseline: { atCommit: null, currentEffective: null },
      updated: { atCommit: null, currentEffective: null },
    },
    softFailureMessage: null,
  }),
}));

vi.mock("@/app/(operator)/insights/compare-two-reviews/_sections/CompareFindingCorrelationSection", () => ({
  CompareFindingCorrelationSection: () => null,
}));

vi.mock("@/app/(operator)/insights/compare-two-reviews/_sections/CompareGovernanceDiffSection", () => ({
  CompareGovernanceDiffSection: () => null,
}));

vi.mock("@/components/compare/CompareRawManifestDiffSection", () => ({
  CompareRawManifestDiffSection: () => null,
}));

vi.mock("@/components/compare/StructuredComparisonView", () => ({
  StructuredComparisonView: () => null,
}));

const goldenWithDeltas: GoldenManifestComparison = {
  baseRunId: "run-base",
  targetRunId: "run-target",
  decisionChanges: [
    {
      decisionKey: "deploy-region",
      baseValue: "east",
      targetValue: "west",
      changeType: "Modified",
    },
  ],
  requirementChanges: [],
  securityChanges: [],
  topologyChanges: [],
  costChanges: [],
  summaryHighlights: ["Region changed for residency"],
  totalDeltaCount: 1,
};

describe("Compare verdict and trust banner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("CompareVerdictSummary surfaces total changes, category counts, and sponsor recommendation", () => {
    render(<CompareVerdictSummary golden={goldenWithDeltas} />);

    expect(screen.getByTestId("compare-verdict-summary")).toHaveTextContent("Total changes:");
    expect(screen.getByTestId("compare-verdict-summary")).toHaveTextContent("1");
    expect(screen.getByTestId("compare-verdict-category-counts")).toHaveTextContent("Decisions");
    expect(screen.getByTestId("compare-sponsor-recommendation")).toHaveTextContent("Region changed for residency");
  });

  it("CompareComparisonTrustBanner rolls governance and AI caveats into one banner", () => {
    render(
      <CompareComparisonTrustBanner
        executionModeHonesty={null}
        usesCurrentEffectiveOnly
        hasAiNarrative
      />,
    );

    expect(screen.getByTestId("compare-comparison-trust-banner")).toBeInTheDocument();
    expect(screen.getAllByText("Governance diff uses current effective policy only").length).toBeGreaterThan(0);
    expect(screen.getByText("Caution")).toBeInTheDocument();
  });

  it("keeps trust banner and verdict when selections are stale but golden results remain", () => {
    render(
      <CompareResultsPanel
        showStaleInputsWarning
        lastComparedPair={{ left: "run-base", right: "run-target" }}
        leftPickedSummary={null}
        rightPickedSummary={null}
        loading={false}
        leftTrim="run-other"
        rightTrim="run-target"
        aiLoading={false}
        legacyFailure={null}
        legacyMalformed={null}
        goldenFailure={null}
        goldenMalformed={null}
        aiFailure={null}
        aiMalformed={null}
        hasResultsToNavigate={false}
        golden={goldenWithDeltas}
        result={null}
        aiExplanation={null}
        comparisonNarrative={null}
        comparisonNarrativeLoading={false}
        buyerPolished
      />,
    );

    expect(screen.getByTestId("compare-comparison-trust-banner")).toBeInTheDocument();
    expect(screen.getByTestId("compare-verdict-summary")).toBeInTheDocument();
    expect(screen.getAllByText("Governance diff uses current effective policy only").length).toBeGreaterThan(0);
  });
});
