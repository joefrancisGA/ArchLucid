/** @vitest-environment jsdom */
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="mermaid-diagram">{source}</div>
  ),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/first-architecture-review",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockUseCorePilotCommitContextQuery = vi.fn();

vi.mock("@/hooks/use-core-pilot-commit-context-query", () => ({
  useCorePilotCommitContextQuery: () => mockUseCorePilotCommitContextQuery(),
}));

import { HelpCorePilotGuideView } from "@/app/(operator)/help/_sections/HelpCorePilotGuideView";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import {
  CORE_PILOT_HELP_CLAIM_DISCIPLINE,
  CORE_PILOT_HELP_FOLLOW_UPS_TITLE,
  CORE_PILOT_HELP_SOURCES,
} from "@/lib/core-pilot-help-evidence-copy";
import {
  CORE_PILOT_HELP_FIRST_VIEWPORT_TEST_ID,
  CORE_PILOT_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  CORE_PILOT_HELP_ORIENTATION_BOTTOM_TEST_ID,
  CORE_PILOT_HELP_PAGE_SUBTITLE_BUYER,
  CORE_PILOT_HELP_PRIMARY_CONTENT_ID,
  CORE_PILOT_HELP_SKIP_LINK_LABEL,
  CORE_PILOT_HELP_SKIP_TARGET_ID,
  CORE_PILOT_HELP_START_HERE_HELPER,
} from "@/lib/core-pilot-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpCorePilotGuideView buyer-polished shell (COR)", () => {
  const entry = getProductDocumentationEntry("first-architecture-review");

  beforeEach(() => {
    mockUseCorePilotCommitContextQuery.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        hasCommittedManifest: false,
        committedReviewCount: 0,
        latestRunId: null,
        firstCommittedRunId: null,
        secondCommittedRunId: null,
        latestRunReadyToFinalize: false,
        sealedReviewRecord: null,
      },
    });
  });

  it("renders skip link, header claim discipline, first-viewport start panel, and bottom Sources", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: CORE_PILOT_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${CORE_PILOT_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(CORE_PILOT_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(entry.summary)).not.toBeInTheDocument();
    expect(screen.getByTestId(CORE_PILOT_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      CORE_PILOT_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("core-pilot-guide-vocabulary-disclosure")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("core-pilot-help-closing-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("core-pilot-related-guides")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: CORE_PILOT_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId(CORE_PILOT_HELP_PRIMARY_CONTENT_ID);
    const buyerFirstViewport = screen.getByTestId(CORE_PILOT_HELP_FIRST_VIEWPORT_TEST_ID);
    const summaryCard = screen.getByTestId("core-pilot-summary-card");
    const stepper = screen.getByTestId("core-pilot-workflow-stepper");
    const orientationBottom = screen.getByTestId(CORE_PILOT_HELP_ORIENTATION_BOTTOM_TEST_ID);

    expect(primaryContent).toContainElement(buyerFirstViewport);
    expect(buyerFirstViewport).toContainElement(summaryCard);
    expect(
      within(summaryCard).getByRole("link", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA }),
    ).toHaveAttribute("href", "/architecture/reviews/new");
    expect(screen.getByTestId("help-core-pilot-start-here-helper")).toHaveTextContent(
      CORE_PILOT_HELP_START_HERE_HELPER,
    );
    expect(primaryContent).toContainElement(stepper);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(buyerFirstViewport.compareDocumentPosition(stepper) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(stepper.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const sourcesSection = screen.getByTestId("core-pilot-help-sources");

    for (const source of filterWhereToGoNextFollowUpLinks(CORE_PILOT_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
