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

vi.mock("@/app/(operator)/help/_sections/HelpAzureBoardsConnectionContext", () => ({
  HelpAzureBoardsConnectionContext: () => <div data-testid="help-azure-boards-connection-context" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { HelpAzureBoardsGuideView } from "@/app/(operator)/help/_sections/HelpAzureBoardsGuideView";
import {
  AZURE_BOARDS_HELP_CLAIM_DISCIPLINE,
  AZURE_BOARDS_HELP_CONTINUE_HEADING,
  AZURE_BOARDS_HELP_FOLLOW_UPS_TITLE,
  AZURE_BOARDS_HELP_PAGE_SUBTITLE,
  AZURE_BOARDS_HELP_SOURCES,
} from "@/lib/azure-boards-help-evidence-copy";
import {
  AZURE_BOARDS_HELP_FIRST_VIEWPORT_TEST_ID,
  AZURE_BOARDS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  AZURE_BOARDS_HELP_PRIMARY_CONTENT_ID,
  AZURE_BOARDS_HELP_SKIP_LINK_LABEL,
  AZURE_BOARDS_HELP_SKIP_TARGET_ID,
} from "@/lib/azure-boards-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpAzureBoardsGuideView buyer-polished shell (HEZ)", () => {
  const entry = getProductDocumentationEntry("azure-boards");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (entry === undefined) {
      throw new Error("Expected azure-boards documentation entry.");
    }

    render(
      <HelpAzureBoardsGuideView
        entry={entry}
        markdown={["# Azure Boards integration", "", "## Setup steps", "", "1. Step one."].join("\n")}
      />,
    );

    expect(screen.getByRole("link", { name: AZURE_BOARDS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AZURE_BOARDS_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(AZURE_BOARDS_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId(AZURE_BOARDS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      AZURE_BOARDS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-azure-boards-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-azure-boards-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-azure-boards-header-actions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-azure-boards-sources-heading")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-pdf")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AZURE_BOARDS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId(AZURE_BOARDS_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(AZURE_BOARDS_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-azure-boards-action-panel");
    const orientationBottom = screen.getByTestId("help-azure-boards-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-azure-boards-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(actionPanel);
    expect(screen.getByRole("heading", { level: 2, name: AZURE_BOARDS_HELP_CONTINUE_HEADING })).toBeInTheDocument();
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(AZURE_BOARDS_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
