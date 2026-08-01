import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpExecutiveSummaryGuideView } from "@/app/(operator)/help/_sections/HelpExecutiveSummaryGuideView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/help/HelpTopicPdfDownloadButton", () => ({
  HelpTopicPdfDownloadButton: () => null,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => null,
}));

const EXECUTIVE_SUMMARY_HELP_BANNED_SUBSTRINGS = [
  "frequently asked questions",
  "day-one-developer",
  "archlucid.contracts",
  "v1_scope.md",
  "api_contracts.md",
] as const;

describe("HelpTopicExecutiveSummary", () => {
  const loaded = tryLoadProductDocumentation("executive-summary");

  it("loads executive-summary from sponsor brief sections (TB-1686)", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Executive summary");
    expect(loaded?.entry.sourcePaths[0]?.toLowerCase()).toContain("executive_sponsor_brief.md");
  });

  it("purges FAQ dump leakage and renders sponsor framing with primary CTA (TB-1687, TB-1690)", () => {
    if (loaded === null) {
      throw new Error("Expected executive-summary documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(
      loaded.markdown,
      sourcePath,
      { helpTopicSlug: loaded.entry.slug },
    ).toLowerCase();

    for (const banned of EXECUTIVE_SUMMARY_HELP_BANNED_SUBSTRINGS) {
      expect(preparedMarkdown, `prepared markdown contains "${banned}"`).not.toContain(banned);
    }

    expect(preparedMarkdown).toContain("what pilot proves");

    render(<HelpExecutiveSummaryGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-executive-summary-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-executive-summary-page-title")).toHaveTextContent("Executive summary");
    expect(screen.getByRole("link", { name: /open executive value report/i })).toHaveAttribute(
      "href",
      SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
    );

    const pageHeadings = screen.getAllByRole("heading", { level: 1 });
    expect(pageHeadings).toHaveLength(1);
    expect(pageHeadings[0]).toHaveTextContent("Executive summary");
    expect(screen.queryByText(/frequently asked questions/i)).toBeNull();
  });
});
