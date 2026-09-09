/** @vitest-environment jsdom */
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

import { HelpRepeatReviewLoopGuideView } from "@/app/(operator)/help/_sections/HelpRepeatReviewLoopGuideView";
import {
  REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE,
  REPEAT_REVIEW_LOOP_HELP_FOLLOW_UPS_TITLE,
  REPEAT_REVIEW_LOOP_HELP_SOURCES,
} from "@/lib/repeat-review-loop-help-evidence-copy";
import {
  REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE,
  REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE_BUYER,
  REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE,
  REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS,
} from "@/lib/repeat-review-loop-help-guide-content";
import {
  REPEAT_REVIEW_LOOP_HELP_BUYER_OVERVIEW,
  REPEAT_REVIEW_LOOP_HELP_FIRST_VIEWPORT_TEST_ID,
  REPEAT_REVIEW_LOOP_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  REPEAT_REVIEW_LOOP_HELP_ORIENTATION_BOTTOM_TEST_ID,
  REPEAT_REVIEW_LOOP_HELP_PAGE_LEAD,
  REPEAT_REVIEW_LOOP_HELP_PRIMARY_CONTENT_ID,
  REPEAT_REVIEW_LOOP_HELP_SKIP_LINK_LABEL,
  REPEAT_REVIEW_LOOP_HELP_SKIP_TARGET_ID,
  REPEAT_REVIEW_LOOP_HELP_START_HERE_HELPER,
} from "@/lib/repeat-review-loop-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpRepeatReviewLoopGuideView buyer-polished shell (HRX)", () => {
  const loaded = tryLoadProductDocumentation("repeat-review-loop");

  it("renders skip link, intro lead, header claim discipline, first-viewport start loop, and bottom Sources", () => {
    if (loaded === null) {
      throw new Error("Expected repeat-review-loop documentation to load.");
    }

    render(<HelpRepeatReviewLoopGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: REPEAT_REVIEW_LOOP_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${REPEAT_REVIEW_LOOP_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(REPEAT_REVIEW_LOOP_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-repeat-review-loop-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-repeat-review-loop-header-actions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-repeat-review-loop-related-help")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: REPEAT_REVIEW_LOOP_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-repeat-review-loop-page-title")).toHaveTextContent(
      REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE,
    );

    expect(screen.getByTestId("help-repeat-review-loop-intro")).toHaveTextContent(REPEAT_REVIEW_LOOP_HELP_PAGE_LEAD);
    expect(screen.getByTestId("help-repeat-review-loop-overview")).toHaveTextContent(
      REPEAT_REVIEW_LOOP_HELP_BUYER_OVERVIEW,
    );

    const primaryContent = screen.getByTestId(REPEAT_REVIEW_LOOP_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(REPEAT_REVIEW_LOOP_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-repeat-review-loop-action-panel");
    const overview = screen.getByTestId("help-repeat-review-loop-overview");
    const stepper = screen.getByTestId("repeat-review-loop-workflow-stepper");
    const orientationBottom = screen.getByTestId(REPEAT_REVIEW_LOOP_HELP_ORIENTATION_BOTTOM_TEST_ID);

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(
      within(actionPanel).getByRole("link", { name: REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.compareReviews.label }),
    ).toHaveAttribute("href", REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.compareReviews.href);
    expect(screen.getByTestId("help-repeat-review-loop-start-here-helper")).toHaveTextContent(
      REPEAT_REVIEW_LOOP_HELP_START_HERE_HELPER,
    );
    expect(primaryContent).toContainElement(overview);
    expect(primaryContent).toContainElement(stepper);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(overview.compareDocumentPosition(stepper) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(stepper.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const sourcesSection = screen.getByTestId("repeat-review-loop-help-sources");

    for (const source of filterWhereToGoNextFollowUpLinks(REPEAT_REVIEW_LOOP_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
