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

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

import { HelpReviewGuideView } from "@/app/(operator)/help/_sections/HelpReviewGuideView";
import {
  REVIEW_GUIDE_HELP_FOLLOW_UPS_TITLE,
  REVIEW_GUIDE_HELP_SOURCES,
} from "@/lib/review-guide-help-evidence-copy";
import {
  REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE,
  REVIEW_GUIDE_HELP_PAGE_SUBTITLE,
  REVIEW_GUIDE_HELP_PAGE_TITLE,
  REVIEW_GUIDE_HELP_PRIMARY_ACTIONS,
} from "@/lib/review-guide-help-guide-content";
import {
  REVIEW_GUIDE_HELP_BUYER_OVERVIEW,
  REVIEW_GUIDE_HELP_FIRST_VIEWPORT_TEST_ID,
  REVIEW_GUIDE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  REVIEW_GUIDE_HELP_ORIENTATION_BOTTOM_TEST_ID,
  REVIEW_GUIDE_HELP_PAGE_LEAD,
  REVIEW_GUIDE_HELP_PAGE_SUBTITLE_BUYER,
  REVIEW_GUIDE_HELP_PRIMARY_CONTENT_ID,
  REVIEW_GUIDE_HELP_SKIP_LINK_LABEL,
  REVIEW_GUIDE_HELP_SKIP_TARGET_ID,
  REVIEW_GUIDE_HELP_START_HERE_HELPER,
} from "@/lib/review-guide-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpReviewGuideView buyer-polished shell (HR)", () => {
  const entry = getProductDocumentationEntry("review-guide");
  const loaded = tryLoadProductDocumentation("review-guide");

  it("renders skip link, intro lead, header claim discipline, first-viewport start here, and bottom Sources", () => {
    if (entry === undefined || loaded === null) {
      throw new Error("Expected review-guide documentation to load.");
    }

    render(<HelpReviewGuideView entry={entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: REVIEW_GUIDE_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${REVIEW_GUIDE_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(REVIEW_GUIDE_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(REVIEW_GUIDE_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(REVIEW_GUIDE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-review-guide-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-review-guide-provenance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-review-guide-header-actions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-review-guide-related-guides")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-review-guide-footer-actions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: REVIEW_GUIDE_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-review-guide-page-title")).toHaveTextContent(REVIEW_GUIDE_HELP_PAGE_TITLE);

    expect(screen.getByTestId("help-review-guide-intro")).toHaveTextContent(REVIEW_GUIDE_HELP_PAGE_LEAD);
    expect(screen.getByTestId("help-review-guide-overview")).toHaveTextContent(
      REVIEW_GUIDE_HELP_BUYER_OVERVIEW,
    );

    const primaryContent = screen.getByTestId(REVIEW_GUIDE_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(REVIEW_GUIDE_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-review-guide-action-panel");
    const overview = screen.getByTestId("help-review-guide-overview");
    const content = screen.getByTestId("help-review-guide-content");
    const orientationBottom = screen.getByTestId(REVIEW_GUIDE_HELP_ORIENTATION_BOTTOM_TEST_ID);

    expect(primaryContent).toContainElement(firstViewport);
    expect(screen.getByTestId("help-review-guide-intro")).toHaveTextContent(REVIEW_GUIDE_HELP_PAGE_LEAD);
    expect(firstViewport).toContainElement(actionPanel);
    expect(
      within(actionPanel).getByRole("link", { name: REVIEW_GUIDE_HELP_PRIMARY_ACTIONS.startReview.label }),
    ).toHaveAttribute("href", REVIEW_GUIDE_HELP_PRIMARY_ACTIONS.startReview.href);
    expect(screen.getByTestId("help-review-guide-start-here-helper")).toHaveTextContent(
      REVIEW_GUIDE_HELP_START_HERE_HELPER,
    );
    expect(primaryContent).toContainElement(overview);
    expect(primaryContent).toContainElement(content);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(overview.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(content.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const sourcesSection = screen.getByTestId("help-review-guide-sources");

    for (const source of filterWhereToGoNextFollowUpLinks(REVIEW_GUIDE_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
