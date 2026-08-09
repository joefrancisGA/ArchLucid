import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpAzureBoardsGuideView } from "@/app/(operator)/help/_sections/HelpAzureBoardsGuideView";
import {
  AZURE_BOARDS_HELP_CANONICAL_PATH,
  AZURE_BOARDS_HELP_PRIMARY_ACTIONS,
  AZURE_BOARDS_HELP_SOURCES,
} from "@/lib/azure-boards-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpAzureBoardsGuideView (HEZ)", () => {
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
