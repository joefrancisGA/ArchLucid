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

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { HelpJiraIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpJiraIntegrationGuideView";
import {
  JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  JIRA_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  JIRA_INTEGRATION_HELP_SOURCES,
} from "@/lib/jira-integration-help-evidence-copy";
import {
  JIRA_INTEGRATION_HELP_PAGE_SUBTITLE,
  JIRA_INTEGRATION_HELP_PRIMARY_ACTION,
} from "@/lib/jira-integration-help-guide-content";
import {
  JIRA_INTEGRATION_HELP_FIRST_VIEWPORT_TEST_ID,
  JIRA_INTEGRATION_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  JIRA_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID,
  JIRA_INTEGRATION_HELP_PAGE_SUBTITLE_BUYER,
  JIRA_INTEGRATION_HELP_PRIMARY_CONTENT_ID,
  JIRA_INTEGRATION_HELP_SKIP_LINK_LABEL,
  JIRA_INTEGRATION_HELP_SKIP_TARGET_ID,
  JIRA_INTEGRATION_HELP_START_HERE_HELPER,
} from "@/lib/jira-integration-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpJiraIntegrationGuideView buyer-polished shell (HEJ)", () => {
  const entry = getProductDocumentationEntry("jira-integration");

  it("renders skip link, header claim discipline, first-viewport start here, and bottom Sources", () => {
    if (entry === undefined) {
      throw new Error("Expected jira-integration documentation entry.");
    }

    render(<HelpJiraIntegrationGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: JIRA_INTEGRATION_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${JIRA_INTEGRATION_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(JIRA_INTEGRATION_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(JIRA_INTEGRATION_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(JIRA_INTEGRATION_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-jira-integration-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: JIRA_INTEGRATION_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId(JIRA_INTEGRATION_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(JIRA_INTEGRATION_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-jira-integration-action-panel");
    const orientationBottom = screen.getByTestId(JIRA_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID);
    const overview = screen.getByTestId("help-jira-integration-overview");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(primaryContent).toContainElement(overview);
    expect(firstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId("help-jira-integration-start-here-helper")).toHaveTextContent(
      JIRA_INTEGRATION_HELP_START_HERE_HELPER,
    );
    expect(
      within(actionPanel).getByRole("link", { name: JIRA_INTEGRATION_HELP_PRIMARY_ACTION.label }),
    ).toHaveAttribute("href", JIRA_INTEGRATION_HELP_PRIMARY_ACTION.href);

    const sourcesSection = screen.getByTestId("help-jira-integration-sources");

    for (const source of filterWhereToGoNextFollowUpLinks(JIRA_INTEGRATION_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
