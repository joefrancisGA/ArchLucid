import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/AskSearchEvidenceVocabularyRail", () => ({
  AskSearchEvidenceVocabularyRail: () => <div data-testid="ask-search-evidence-vocabulary-rail" />,
}));

vi.mock("@/components/AskArchitectureIntelligenceVocabularyRail", () => ({
  AskArchitectureIntelligenceVocabularyRail: () => <div data-testid="ask-architecture-intelligence-vocabulary-rail" />,
}));

vi.mock("@/components/ask/AskVsFrontierAiDifferentiationStrip", () => ({
  AskVsFrontierAiDifferentiationStrip: () => <div data-testid="ask-vs-frontier-ai-differentiation-strip" />,
}));

vi.mock("@/components/PageCapabilityBoundaryStrip", () => ({
  PageCapabilityBoundaryStrip: () => <div data-testid="page-capability-boundary-strip" />,
}));

vi.mock("@/app/(operator)/insights/ask-review-questions/_sections/AskMainPanel", () => ({
  AskMainPanel: () => <div data-testid="ask-main-panel" />,
}));

vi.mock("@/app/(operator)/insights/ask-review-questions/_sections/AskThreadHistoryPanel", () => ({
  AskThreadHistoryPanel: () => null,
}));

vi.mock("@/app/(operator)/insights/ask-review-questions/_sections/AskNextReviewFooterClient", () => ({
  AskNextReviewFooterClient: () => null,
}));

const useAskPageMock = vi.fn();

vi.mock("@/app/(operator)/insights/ask-review-questions/_sections/use-ask-page", () => ({
  useAskPage: (): ReturnType<typeof useAskPageMock> => useAskPageMock(),
}));

vi.mock("@/hooks/use-ask-run-coverage-honesty-query", () => ({
  useAskRunCoverageHonestyQuery: () => ({ data: undefined }),
}));

import { AskPageContent } from "@/app/(operator)/insights/ask-review-questions/_sections/AskPageContent";
import {
  ASK_REVIEW_QUESTIONS_FOLLOW_UPS_TITLE,
  buildAskReviewQuestionsSources,
} from "@/lib/ask-review-questions-evidence-copy";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { filterOrientationSourcesForJobContext } from "@/lib/evidence-orientation/job-context-orientation-sources-filter";
import { ASK_REVIEW_ARTIFACT_STATUS_MISSING } from "@/lib/ask-review-artifact-status-copy";
import {
  ASK_REVIEW_QUESTIONS_FIRST_VIEWPORT_TEST_ID,
  ASK_REVIEW_QUESTIONS_PRIMARY_CONTENT_ID,
  ASK_REVIEW_QUESTIONS_SKIP_LINK_LABEL,
  ASK_REVIEW_QUESTIONS_SKIP_TARGET_ID,
} from "@/lib/ask-review-questions-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

function buildAskPageState(
  overrides: Partial<ReturnType<typeof useAskPageMock>> = {},
): ReturnType<typeof useAskPageMock> {
  return {
    buyerPolishedShell: true,
    threads: [],
    selectedThreadId: "",
    messages: [],
    runId: "",
    setRunId: vi.fn(),
    baseRunId: "",
    setBaseRunId: vi.fn(),
    targetRunId: "",
    setTargetRunId: vi.fn(),
    question: "",
    setQuestion: vi.fn(),
    questionRef: { current: null },
    loading: false,
    askStreaming: false,
    compareOpen: false,
    setCompareOpen: vi.fn(),
    listFailure: null,
    actionFailure: null,
    retrievalDegraded: false,
    hideCompareChrome: true,
    continueLastThread: null,
    showContinueLastThreadRow: false,
    threadSelected: false,
    runAnchorUnset: true,
    listDateFormatter: () => "",
    askDisabled: true,
    showPostAssistantFollowUps: false,
    showRunDeepLinkPrompts: false,
    askAssistantGroundingLinks: null,
    askCitationActionFollowUps: [],
    streamingAssistantContent: "",
    reviewScopedForAsking: false,
    showThreadHistoryPanel: false,
    onPickReviewForAsking: vi.fn(),
    onNewConversation: vi.fn(),
    onSelectThread: vi.fn(),
    onStarterPromptClick: vi.fn(),
    mergePromptLine: vi.fn(),
    onAsk: vi.fn(),
    ...overrides,
  };
}

describe("AskPageContent buyer-polished shell (ASK)", () => {
  it("renders skip link, first-viewport pick-review panel, header claim discipline, and sources-only orientation", () => {
    useAskPageMock.mockReturnValue(buildAskPageState());

    render(<AskPageContent />);

    expect(screen.getByRole("link", { name: ASK_REVIEW_QUESTIONS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ASK_REVIEW_QUESTIONS_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("ask-review-questions-header-claim-discipline")).toHaveTextContent(
      ASK_REVIEW_ARTIFACT_STATUS_MISSING.slice(0, 40),
    );
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ask-search-evidence-vocabulary-rail")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ask-architecture-intelligence-vocabulary-rail")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ask-vs-frontier-ai-differentiation-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-capability-boundary-strip")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: ASK_REVIEW_QUESTIONS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("ask-review-questions-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(ASK_REVIEW_QUESTIONS_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(ASK_REVIEW_QUESTIONS_FIRST_VIEWPORT_TEST_ID);
    const startHerePanel = screen.getByTestId("ask-review-questions-start-here-panel");
    const pickReviewStrip = screen.getByTestId("ask-pick-review-before-asking-strip");
    const orientationBottom = screen.getByTestId("ask-review-questions-orientation-bottom");
    const sourcesSection = screen.getByTestId("ask-review-questions-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(startHerePanel);
    expect(startHerePanel).toContainElement(pickReviewStrip);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);

    const expectedSources = filterOrientationSourcesForJobContext(
      filterWhereToGoNextFollowUpLinks(buildAskReviewQuestionsSources(false)),
      ASK_REVIEW_QUESTIONS_PATH,
      undefined,
    );

    for (const source of expectedSources) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
