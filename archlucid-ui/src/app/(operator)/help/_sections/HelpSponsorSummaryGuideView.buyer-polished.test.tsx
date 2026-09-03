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

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { HelpSponsorSummaryGuideView } from "@/app/(operator)/help/_sections/HelpSponsorSummaryGuideView";
import {
  SPONSOR_SUMMARY_HELP_CLAIM_DISCIPLINE,
  SPONSOR_SUMMARY_HELP_FOLLOW_UPS_TITLE,
  SPONSOR_SUMMARY_HELP_SOURCES,
} from "@/lib/sponsor/sponsor-report-help-evidence-copy";
import {
  SPONSOR_REPORT_HELP_FIRST_VIEWPORT_TEST_ID,
  SPONSOR_REPORT_HELP_PRIMARY_CONTENT_ID,
  SPONSOR_REPORT_HELP_SKIP_LINK_LABEL,
  SPONSOR_REPORT_HELP_SKIP_TARGET_ID,
} from "@/lib/sponsor/sponsor-report-help-page-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { SPONSOR_SUMMARY_HELP_PRIMARY_ACTIONS } from "@/lib/sponsor/sponsor-report-help-guide-content";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpSponsorSummaryGuideView buyer-polished shell (EXE)", () => {
  const loaded = tryLoadProductDocumentation("sponsor-report");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (loaded === null) {
      throw new Error("Expected sponsor-report documentation to load.");
    }

    render(<HelpSponsorSummaryGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: SPONSOR_REPORT_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SPONSOR_REPORT_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-sponsor-report-header-claim-discipline")).toHaveTextContent(
      SPONSOR_SUMMARY_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-sponsor-report-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-sponsor-report-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SPONSOR_SUMMARY_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-sponsor-report-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(SPONSOR_REPORT_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(SPONSOR_REPORT_HELP_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("help-sponsor-report-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-sponsor-report-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId("help-sponsor-report-start-review")).toHaveAttribute(
      "href",
      SPONSOR_SUMMARY_HELP_PRIMARY_ACTIONS.startFirstReview.href,
    );

    for (const source of SPONSOR_SUMMARY_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
