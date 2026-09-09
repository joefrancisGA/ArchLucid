/** @vitest-environment jsdom */
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const evalChromeMock = vi.hoisted(() => ({ enabled: true }));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => evalChromeMock.enabled,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/app/(operator)/insights/compare-two-reviews/_sections/use-compare-form", () => ({
  useCompareForm: () => ({
    comparePagePath: "/insights/compare-two-reviews",
    comparePageSubtitle: "Select two finalized reviews to see what changed in scope, findings, decisions, and evidence.",
    buyerComparePageTitle: "Compare reviews",
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
    buyerPolished: true,
    finalizedCount: 2,
    leftPickerLabel: "Baseline review",
    rightPickerLabel: "Updated review",
    pickClaimsIntakePair: vi.fn(),
    urlPairComplete: false,
    showInsufficientFinalized: false,
    showEmptyComparisonOutput: true,
    loadBuyerSampleComparison: vi.fn(),
    showRelatedReviewLinks: true,
    showContinueLastComparisonRow: false,
  }),
}));

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

vi.mock("@/components/ValidateCompareVocabularyRail", () => ({
  ValidateCompareVocabularyRail: () => <div data-testid="validate-compare-vocabulary-rail" />,
}));

vi.mock("@/components/ImpactPreviewCompareVocabularyRail", () => ({
  ImpactPreviewCompareVocabularyRail: () => <div data-testid="impact-preview-compare-vocabulary-rail" />,
}));

vi.mock("@/components/PageCapabilityBoundaryStrip", () => ({
  PageCapabilityBoundaryStrip: () => <div data-testid="page-capability-boundary-strip" />,
}));

vi.mock("@/components/integrations/IntegrationConnectChecklist", () => ({
  IntegrationConnectChecklist: () => <div data-testid="compare-two-reviews-checklist" />,
}));

vi.mock("@/app/(operator)/insights/compare-two-reviews/_sections/CompareRunPickersSection", () => ({
  CompareRunPickersSection: () => <div data-testid="compare-run-pickers-section" />,
}));

vi.mock("@/app/(operator)/insights/compare-two-reviews/_sections/CompareHowComparisonWorksSection", () => ({
  CompareHowComparisonWorksSection: () => <div data-testid="compare-how-comparison-works-section" />,
}));

import { CompareForm } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareForm";
import {
  COMPARE_CLAIM_DISCIPLINE,
  COMPARE_FOLLOW_UPS_TITLE,
  COMPARE_SOURCES,
} from "@/lib/compare-evidence-copy";
import { COMPARE_PAGE_SUBTITLE } from "@/app/(operator)/insights/compare-two-reviews/_sections/ComparePageIntro";
import {
  COMPARE_BUYER_OVERVIEW,
  COMPARE_PAGE_LEAD,
  COMPARE_PAGE_SUBTITLE_BUYER,
  COMPARE_START_HERE_HELPER,
  COMPARE_TWO_REVIEWS_FIRST_VIEWPORT_TEST_ID,
  COMPARE_TWO_REVIEWS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  COMPARE_TWO_REVIEWS_ORIENTATION_BOTTOM_TEST_ID,
  COMPARE_TWO_REVIEWS_PRIMARY_CONTENT_ID,
  COMPARE_TWO_REVIEWS_SKIP_LINK_LABEL,
  COMPARE_TWO_REVIEWS_SKIP_TARGET_ID,
} from "@/lib/compare-two-reviews-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("CompareForm buyer-polished shell (CXX)", () => {
  beforeEach(() => {
    evalChromeMock.enabled = true;
  });

  it("renders skip link, intro lead, header claim discipline, first-viewport preview, and bottom Sources", () => {
    render(<CompareForm />);

    expect(screen.getByRole("link", { name: COMPARE_TWO_REVIEWS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${COMPARE_TWO_REVIEWS_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(COMPARE_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(COMPARE_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(COMPARE_TWO_REVIEWS_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      COMPARE_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("compare-related-surfaces-disclosure")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: COMPARE_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId(COMPARE_TWO_REVIEWS_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(COMPARE_TWO_REVIEWS_FIRST_VIEWPORT_TEST_ID);
    const dimensionsPreview = screen.getByTestId("compare-dimensions-preview");
    const overview = screen.getByTestId("compare-two-reviews-overview");
    const workspace = screen.getByTestId("compare-workspace");
    const orientationBottom = screen.getByTestId(COMPARE_TWO_REVIEWS_ORIENTATION_BOTTOM_TEST_ID);

    expect(primaryContent).toContainElement(firstViewport);
    expect(screen.getByTestId("compare-two-reviews-intro")).toHaveTextContent(COMPARE_PAGE_LEAD);
    expect(firstViewport).toContainElement(dimensionsPreview);
    expect(screen.getByTestId("compare-two-reviews-start-here-helper")).toHaveTextContent(COMPARE_START_HERE_HELPER);
    expect(screen.getByTestId("compare-two-reviews-overview")).toHaveTextContent(COMPARE_BUYER_OVERVIEW);
    expect(primaryContent).toContainElement(overview);
    expect(primaryContent).toContainElement(workspace);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(overview.compareDocumentPosition(workspace) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(workspace.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const sourcesSection = screen.getByTestId("compare-two-reviews-sources");

    for (const source of filterWhereToGoNextFollowUpLinks(COMPARE_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
