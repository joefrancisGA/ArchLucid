import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const evalChromeMock = vi.hoisted(() => ({ enabled: false }));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => evalChromeMock.enabled,
}));

vi.mock("@/app/(operator)/insights/compare-two-reviews/_sections/use-compare-form", () => ({
  useCompareForm: () => ({
    comparePagePath: "/insights/compare-two-reviews",
    comparePageSubtitle: "subtitle",
    buyerComparePageTitle: "Compare",
    buyerComparePrimaryActionLabel: "Compare reviews",
    leftRunId: "",
    rightRunId: "",
    setLeftRunId: vi.fn(),
    setRightRunId: vi.fn(),
    result: null,
    golden: null,
    legacyFailure: null,
    goldenFailure: null,
    legacyMalformed: null,
    goldenMalformed: null,
    loading: false,
    aiExplanation: null,
    aiFailure: null,
    aiMalformed: null,
    aiLoading: false,
    comparisonNarrative: null,
    comparisonNarrativeLoading: false,
    lastComparedPair: null,
    leftPickedSummary: null,
    rightPickedSummary: null,
    continueLastPair: null,
    syncSelectionToUrl: vi.fn(),
    handleLeftRunIdChange: vi.fn(),
    handleRightRunIdChange: vi.fn(),
    setLeftPickedSummary: vi.fn(),
    setRightPickedSummary: vi.fn(),
    leftTrim: "",
    rightTrim: "",
    sameCanonicalRunIdsBlocked: false,
    leftFootnote: null,
    rightFootnote: null,
    pairAligned: false,
    showStaleInputsWarning: false,
    compareHasRenderableOutcome: false,
    compareInsightFirstLayout: false,
    compareChecklistSteps: [],
    compareChecklistEmphasizedStepId: null,
    onCompare: vi.fn(),
    loadAiExplanation: vi.fn(),
    hasResultsToNavigate: false,
    buyerPolished: evalChromeMock.enabled,
    finalizedCount: 2,
    leftPickerLabel: "Baseline review",
    rightPickerLabel: "Updated review",
    pickClaimsIntakePair: vi.fn(),
    urlPairComplete: false,
    showInsufficientFinalized: false,
    showEmptyComparisonOutput: true,
    loadBuyerSampleComparison: vi.fn(),
    showRelatedReviewLinks: false,
    showContinueLastComparisonRow: false,
  }),
}));

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => true,
}));

import { CompareForm } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareForm";

describe("CompareForm eval leakage guard (DA-09)", () => {
  beforeEach(() => {
    evalChromeMock.enabled = false;
  });

  it("hides the demo Claims Intake quick-pick on Working compare", () => {
    render(<CompareForm />);

    expect(screen.queryByText(/Demo — Claims Intake comparison/i)).not.toBeInTheDocument();
  });

  it("allows the demo Claims Intake quick-pick in eval chrome", () => {
    evalChromeMock.enabled = true;

    render(<CompareForm />);

    expect(screen.getByText(/Demo — Claims Intake comparison/i)).toBeInTheDocument();
  });
});
