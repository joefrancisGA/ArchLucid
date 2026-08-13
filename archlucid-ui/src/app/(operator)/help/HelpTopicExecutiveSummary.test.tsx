import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpExecutiveSummaryGuideView } from "@/app/(operator)/help/_sections/HelpExecutiveSummaryGuideView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
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

  it("loads executive-summary with pilot ROI measurement section from scorecard", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.markdown.toLowerCase()).toContain("pilot roi measurement");
    expect(loaded?.markdown.toLowerCase()).toContain("baseline questions");
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
    expect(preparedMarkdown).not.toMatch(/^##\s+\d+\./m);

    render(<HelpExecutiveSummaryGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-executive-summary-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-executive-summary-page-title")).toHaveTextContent("Executive summary");
    expect(screen.getAllByRole("heading", { level: 1, name: "Executive summary" })).toHaveLength(1);
    expect(screen.queryByTestId("help-executive-summary-refresh-button")).toBeNull();
    expect(screen.queryByTestId("help-executive-summary-last-refreshed")).toBeNull();
    expect(screen.getByTestId("help-executive-summary-claim-discipline")).toBeInTheDocument();
    expect(screen.queryByTestId("help-executive-summary-source-of-record")).toBeNull();
    expect(screen.getByRole("link", { name: /open executive value report/i })).toHaveAttribute(
      "href",
      SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
    );

    const contentRegion = screen.getByTestId("help-executive-summary-content");
    const numberedHeadings = within(contentRegion)
      .getAllByRole("heading")
      .filter((heading) => /^\d+\./.test(heading.textContent ?? ""));
    expect(numberedHeadings).toHaveLength(0);

    const pilotRoiLinks = screen.getAllByRole("link", { name: /Sponsor ROI methodology/i });
    expect(pilotRoiLinks.length).toBeGreaterThan(0);
    for (const link of pilotRoiLinks) {
      expect(link.getAttribute("href")).toMatch(
        /^(\/help\/executive-summary#pilot-roi-measurement|#pilot-roi-measurement)$/,
      );
    }

    expect(screen.queryByText(/\bRoi\b/)).toBeNull();
    expect(screen.queryByText(/\bApi\b/)).toBeNull();
    expect(screen.queryByText(/frequently asked questions/i)).toBeNull();
    expect(screen.queryByText(/last refreshed/i)).toBeNull();
    expect(screen.queryByText(/not refreshed yet/i)).toBeNull();

    const actionPanel = screen.getByTestId("help-executive-summary-action-panel");
    expect(actionPanel.className).not.toMatch(/bg-teal-/);
    expect(actionPanel.className).not.toMatch(/border-teal-/);
  });
});
