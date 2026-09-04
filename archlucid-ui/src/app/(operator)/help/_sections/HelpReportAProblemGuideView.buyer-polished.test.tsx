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

import { HelpReportAProblemGuideView } from "@/app/(operator)/help/_sections/HelpReportAProblemGuideView";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import {
  REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE,
  REPORT_A_PROBLEM_HELP_FOLLOW_UPS_TITLE,
  REPORT_A_PROBLEM_HELP_SOURCES,
} from "@/lib/report-a-problem-help-evidence-copy";
import { REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS } from "@/lib/report-a-problem-help-guide-content";
import {
  REPORT_A_PROBLEM_HELP_FIRST_VIEWPORT_TEST_ID,
  REPORT_A_PROBLEM_HELP_PRIMARY_CONTENT_ID,
  REPORT_A_PROBLEM_HELP_SKIP_LINK_LABEL,
  REPORT_A_PROBLEM_HELP_SKIP_TARGET_ID,
} from "@/lib/report-a-problem-help-page-copy";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpReportAProblemGuideView buyer-polished shell (HRE)", () => {
  const loaded = tryLoadProductDocumentation("report-a-problem");

  it("renders skip link, first-viewport action panel, header claim discipline, and sources-only orientation", () => {
    if (loaded === null) {
      throw new Error("Expected report-a-problem documentation to load.");
    }

    render(<HelpReportAProblemGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: REPORT_A_PROBLEM_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${REPORT_A_PROBLEM_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-report-a-problem-header-claim-discipline")).toHaveTextContent(
      REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("report-problem-support-workspace-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("report-problem-audit-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: REPORT_A_PROBLEM_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-report-a-problem-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(REPORT_A_PROBLEM_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(REPORT_A_PROBLEM_HELP_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("help-report-a-problem-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-report-a-problem-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId("help-report-a-problem-action-panel")).toBeInTheDocument();
    expect(screen.getByTestId("help-report-a-problem-no-trigger-callout")).toBeInTheDocument();

    expect(screen.getAllByTestId(REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.openSupport.testId)[0]).toHaveAttribute(
      "href",
      REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.openSupport.href,
    );

    for (const source of filterWhereToGoNextFollowUpLinks(REPORT_A_PROBLEM_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
