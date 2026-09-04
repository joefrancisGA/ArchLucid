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

vi.mock("@/components/ScorecardRoiVocabularyRail", () => ({
  ScorecardRoiVocabularyRail: () => <div data-testid="scorecard-roi-vocabulary-rail" />,
}));

vi.mock("@/components/BaselineRoiVocabularyRail", () => ({
  BaselineRoiVocabularyRail: () => <div data-testid="baseline-roi-vocabulary-rail" />,
}));

import { HelpRoiSummaryGuideView } from "@/app/(operator)/help/_sections/HelpRoiSummaryGuideView";
import {
  ROI_SUMMARY_HELP_CLAIM_DISCIPLINE,
  ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE,
  ROI_SUMMARY_HELP_SOURCES,
} from "@/lib/roi-summary-help-evidence-copy";
import { ROI_SUMMARY_HELP_PRIMARY_ACTION } from "@/lib/roi-summary-help-guide-content";
import {
  ROI_SUMMARY_HELP_FIRST_VIEWPORT_TEST_ID,
  ROI_SUMMARY_HELP_PRIMARY_CONTENT_ID,
  ROI_SUMMARY_HELP_SKIP_LINK_LABEL,
  ROI_SUMMARY_HELP_SKIP_TARGET_ID,
} from "@/lib/roi-summary-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpRoiSummaryGuideView buyer-polished shell (HRO)", () => {
  const entry = getProductDocumentationEntry("roi-summary");

  it("renders skip link, first-viewport action panel, header claim discipline, and sources-only orientation", () => {
    if (entry === undefined) {
      throw new Error("Expected roi-summary documentation entry.");
    }

    render(<HelpRoiSummaryGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: ROI_SUMMARY_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ROI_SUMMARY_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-roi-summary-header-claim-discipline")).toHaveTextContent(
      ROI_SUMMARY_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-roi-summary-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc-mobile")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scorecard-roi-vocabulary-rail")).not.toBeInTheDocument();
    expect(screen.queryByTestId("baseline-roi-vocabulary-rail")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-roi-summary-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(ROI_SUMMARY_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(ROI_SUMMARY_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-roi-summary-action-panel");
    const orientationBottom = screen.getByTestId("help-roi-summary-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-roi-summary-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId("help-roi-summary-start-here-primary-cta")).toHaveAttribute(
      "href",
      ROI_SUMMARY_HELP_PRIMARY_ACTION.href,
    );

    for (const source of filterWhereToGoNextFollowUpLinks(ROI_SUMMARY_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
