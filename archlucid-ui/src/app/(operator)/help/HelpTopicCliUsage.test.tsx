import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/help/HelpTopicPdfDownloadButton", () => ({
  HelpTopicPdfDownloadButton: () => null,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => null,
}));

import { HelpCliUsageTechnicalReferenceView } from "@/app/(operator)/help/_sections/HelpCliUsageTechnicalReferenceView";
import { CLI_USAGE_HELP_PAGE_TITLE } from "@/lib/cli-usage-help-guide-content";
import {
  CLI_USAGE_HELP_PROHIBITED_AUDIENCE_TERMS,
  CLI_USAGE_HELP_REFERENCE_LANDING,
} from "@/lib/help/help-cli-usage-reference-content";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { groupHelpMarkdownHeadings } from "@/lib/help/help-markdown-heading-groups";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const CLI_USAGE_SOURCE = "docs/library/CLI_USAGE.md";

const EXPECTED_MAJOR_SECTION_IDS = [
  "running-the-cli",
  "api-url",
  "commands",
  "first-value-onboarding-product-cli",
  "archlucid-trial-smoke",
  "archlucid-roi-bulletin",
  "shell-completion",
  "comparisons",
  "archlucidjson",
  "environment",
  "exit-codes-3",
  "rest-integration-starter-fixtures",
] as const;

describe("HelpCliUsageTechnicalReferenceView", () => {
  const entry = getProductDocumentationEntry("cli-usage");
  const loaded = tryLoadProductDocumentation("cli-usage");

  it("registers the cli-usage documentation entry", () => {
    expect(entry?.slug).toBe("cli-usage");
    expect(entry?.sourcePaths).toContain(CLI_USAGE_SOURCE);
  });

  it("loads CLI usage markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("keeps the CLI heading index aligned with the authoritative markdown source", () => {
    if (loaded === null) {
      throw new Error("Expected cli-usage documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, CLI_USAGE_SOURCE, {
      preserveMaintenanceMetadata: true,
      helpTopicSlug: "cli-usage",
    });
    const majorSectionIds = extractHelpMarkdownHeadings(preparedMarkdown)
      .filter((heading) => heading.level === 2)
      .map((heading) => heading.id);

    expect(majorSectionIds).toEqual([...EXPECTED_MAJOR_SECTION_IDS]);
    expect(groupHelpMarkdownHeadings(extractHelpMarkdownHeadings(preparedMarkdown)).length).toBe(
      EXPECTED_MAJOR_SECTION_IDS.length,
    );
  });

  it("renders the reference landing, wider content region, and hierarchical index", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected cli-usage documentation to load.");
    }

    render(<HelpCliUsageTechnicalReferenceView entry={entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("heading", { level: 1, name: CLI_USAGE_HELP_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-cli-usage-reference-landing")).toHaveTextContent(
      CLI_USAGE_HELP_REFERENCE_LANDING.purpose,
    );
    expect(screen.getByTestId("help-cli-usage-reference-content")).toHaveClass("lg:max-w-[52rem]");
    expect(screen.getByTestId("help-technical-reference-toc")).toBeInTheDocument();
    expect(screen.getByTestId("help-cli-usage-major-groups")).toBeInTheDocument();
    expect(screen.getByTestId("help-cli-usage-major-groups").innerHTML).not.toMatch(/bg-teal-|border-teal-/);
  });

  it("does not use prohibited day-one developer audience positioning", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected cli-usage documentation to load.");
    }

    render(<HelpCliUsageTechnicalReferenceView entry={entry} markdown={loaded.markdown} />);

    const visibleText = document.body.textContent?.toLowerCase() ?? "";

    for (const term of CLI_USAGE_HELP_PROHIBITED_AUDIENCE_TERMS) {
      expect(visibleText).not.toContain(term);
    }
  });

  it("exposes copy-link actions for major reference groups", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected cli-usage documentation to load.");
    }

    render(<HelpCliUsageTechnicalReferenceView entry={entry} markdown={loaded.markdown} />);

    const desktopNav = screen.getByTestId("help-technical-reference-toc");

    expect(within(desktopNav).getByTestId("help-section-copy-link-commands")).toBeInTheDocument();
  });

  it("renders customer-safe CLI examples and scrollable command tables", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected cli-usage documentation to load.");
    }

    render(<HelpCliUsageTechnicalReferenceView entry={entry} markdown={loaded.markdown} />);

    const visibleText = document.body.textContent ?? "";

    expect(visibleText).not.toContain("staging.archlucid.net");
    expect(visibleText).toContain("creates a new tenant");
    expect(visibleText).toContain("Set up");
    expect(visibleText).not.toMatch(/ReadAuthority/i);
    expect(screen.getAllByRole("region").length).toBeGreaterThan(0);
    expect(document.querySelectorAll("pre code").length).toBeGreaterThan(0);
    expect(visibleText.match(/dotnet run --project ArchLucid\.Cli/g)?.length ?? 0).toBeLessThanOrEqual(1);
  });
});
