import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpAzureBoardsGuideView } from "@/app/(operator)/help/_sections/HelpAzureBoardsGuideView";
import {
  AZURE_BOARDS_HELP_CANONICAL_PATH,
  AZURE_BOARDS_HELP_PRIMARY_ACTIONS,
  AZURE_BOARDS_HELP_SOURCES,
} from "@/lib/azure-boards-help-evidence-copy";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpAzureBoardsGuideView (HEZ)", () => {
  it("keeps setup steps as one ordered list with the PAT warning after the list", () => {
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
    expect(screen.getByText(/PAT value is never shown again/i).closest("blockquote")).not.toBeNull();
  });

  it("renders orientation, continue-in-product links, breadcrumb, and export actions", () => {
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
    expect(screen.getByTestId("help-azure-boards-page-title").closest("[data-nav-href]")).toHaveAttribute(
      "data-nav-href",
      AZURE_BOARDS_HELP_CANONICAL_PATH,
    );
    expect(screen.getByTestId("help-azure-boards-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("help-azure-boards-action-panel")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sources for follow-up" })).toBeNull();
    expect(screen.getByTestId("help-azure-boards-breadcrumb")).toHaveTextContent("Help");
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
    expect(screen.getByTestId("help-azure-boards-applicability")).toHaveTextContent("Last reviewed 2026-08-09");
    expect(screen.getByTestId("help-azure-boards-applicability")).toHaveTextContent("V1 GA");
    expect(screen.getByTestId("help-topic-download-pdf")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-print-pdf")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: AZURE_BOARDS_HELP_PRIMARY_ACTIONS.openSettings.label })).toHaveAttribute(
      "href",
      "/integrations/azure-boards",
    );
    expect(screen.getByRole("link", { name: "Integrations → Azure Boards" })).toHaveAttribute(
      "href",
      "/integrations/azure-boards",
    );

    for (const link of AZURE_BOARDS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(AZURE_BOARDS_HELP_SOURCES.some((link) => link.href === AZURE_BOARDS_HELP_CANONICAL_PATH)).toBe(false);
  });
});
