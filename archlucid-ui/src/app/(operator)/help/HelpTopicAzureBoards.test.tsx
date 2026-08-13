import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/app/(operator)/help/_sections/HelpAzureBoardsConnectionContext", () => ({
  HelpAzureBoardsConnectionContext: () => <div data-testid="help-azure-boards-connection-context" />,
}));

import { HelpAzureBoardsGuideView } from "@/app/(operator)/help/_sections/HelpAzureBoardsGuideView";
import {
  AZURE_BOARDS_HELP_AUTHORITY_NOTE,
  AZURE_BOARDS_HELP_CANONICAL_PATH,
  AZURE_BOARDS_HELP_CONTINUE_HEADING,
  AZURE_BOARDS_HELP_PAT_NON_RECOVERABLE_WARNING,
  AZURE_BOARDS_HELP_PAT_SCOPE_WARNING,
  AZURE_BOARDS_HELP_PRIMARY_ACTIONS,
  AZURE_BOARDS_HELP_SOURCES,
  AZURE_BOARDS_HELP_SOURCES_HEADING,
} from "@/lib/azure-boards-help-evidence-copy";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpAzureBoardsGuideView (HEZ)", () => {
  it("keeps setup steps as one ordered list with PAT warning after the list", () => {
    const loaded = tryLoadProductDocumentation("azure-boards");

    expect(loaded).not.toBeNull();

    if (loaded === null) {
      throw new Error("Expected azure-boards documentation.");
    }

    render(<HelpAzureBoardsGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const content = screen.getByTestId("help-azure-boards-content");
    const setupLink = within(content).getByRole("link", { name: /Integrations → Azure Boards/i });
    const setupList = setupLink.closest("ol");

    expect(setupList).not.toBeNull();
    expect(within(setupList!).getAllByRole("listitem")).toHaveLength(7);
    expect(within(setupList!).getByText(/Create Azure Boards work item/i)).toBeInTheDocument();
    expect(
      within(setupList!).getByRole("link", { name: /Test connection/i }),
    ).toHaveAttribute("href", "/integrations/azure-boards");
    expect(within(content).getByText(/PAT value is never shown again/i).closest("blockquote")).not.toBeNull();
  });

  it("renders h1 chrome, contextual help, action panel before claim discipline, and export actions", () => {
    const entry = getProductDocumentationEntry("azure-boards");

    expect(entry?.slug).toBe("azure-boards");

    if (entry === null) {
      throw new Error("Expected azure-boards documentation entry.");
    }

    render(
      <HelpAzureBoardsGuideView
        entry={entry}
        markdown={[
          "# Azure Boards integration",
          "",
          "## Setup steps",
          "",
          "1. Open [**Integrations → Azure Boards**](/integrations/azure-boards) (workspace administrator).",
        ].join("\n")}
      />,
    );

    expect(screen.getByTestId("help-azure-boards-guide")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-azure-boards-page-title").closest("[data-nav-href]")).toHaveAttribute(
      "data-nav-href",
      AZURE_BOARDS_HELP_CANONICAL_PATH,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
    expect(screen.getByTestId("help-azure-boards-authority-note")).toHaveTextContent(
      AZURE_BOARDS_HELP_AUTHORITY_NOTE,
    );
    expect(screen.getByTestId("help-azure-boards-pat-warnings")).toHaveTextContent(
      AZURE_BOARDS_HELP_PAT_SCOPE_WARNING,
    );
    expect(screen.getByTestId("help-azure-boards-pat-warnings")).toHaveTextContent(
      AZURE_BOARDS_HELP_PAT_NON_RECOVERABLE_WARNING,
    );
    expect(screen.getByTestId("help-azure-boards-action-panel")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AZURE_BOARDS_HELP_CONTINUE_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("help-azure-boards-sources-heading")).toHaveTextContent(
      AZURE_BOARDS_HELP_SOURCES_HEADING,
    );
    expect(screen.queryByRole("heading", { name: "Orientation only" })).toBeNull();
    expect(screen.getByTestId("help-azure-boards-connection-context")).toBeInTheDocument();
    expect(screen.getByTestId("help-azure-boards-breadcrumb")).toHaveTextContent("Help");
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
    expect(screen.getByTestId("help-topic-print-pdf")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-download-pdf")).toBeNull();
    expect(screen.getByRole("link", { name: AZURE_BOARDS_HELP_PRIMARY_ACTIONS.openSettings.label })).toHaveAttribute(
      "href",
      "/integrations/azure-boards",
    );
    expect(screen.getByTestId("help-azure-boards-setup-step-ctas")).toBeInTheDocument();
    expect(screen.getByTestId("help-azure-boards-setup-step-1-cta")).toHaveAttribute(
      "href",
      "/integrations/azure-boards",
    );
    expect(screen.getByTestId("help-azure-boards-setup-test-connection-cta")).toHaveAttribute(
      "href",
      "/integrations/azure-boards",
    );
    expect(screen.getByTestId("help-azure-boards-setup-step-1-cta")).toHaveTextContent(
      "Integrations → Azure Boards",
    );

    const actionPanel = screen.getByTestId("help-azure-boards-action-panel");
    const claimDiscipline = screen.getByTestId("help-azure-boards-claim-discipline");

    expect(actionPanel.compareDocumentPosition(claimDiscipline) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const link of AZURE_BOARDS_HELP_SOURCES) {
      const sourceLink = screen.getByRole("link", { name: link.label });

      expect(sourceLink).toHaveAttribute("href", link.href);
      expect(sourceLink.className).toMatch(/min-h-6/);
    }

    expect(AZURE_BOARDS_HELP_SOURCES.some((link) => link.href === AZURE_BOARDS_HELP_CANONICAL_PATH)).toBe(false);
  });
});
