import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpSponsorReportGuideView } from "@/app/(operator)/help/_sections/HelpSponsorReportGuideView";
import { expectClaimDisciplineBandContent } from "@/lib/claim-discipline-test-helpers";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import { SPONSOR_SUMMARY_HELP_CLAIM_DISCIPLINE } from "@/lib/sponsor/sponsor-report-help-evidence-copy";

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

const SPONSOR_SUMMARY_HELP_BANNED_SUBSTRINGS = [
  "frequently asked questions",
  "day-one-developer",
  "archlucid.contracts",
  "v1_scope.md",
  "api_contracts.md",
] as const;

describe("HelpTopicSponsorReport", () => {
  const loaded = tryLoadProductDocumentation("sponsor-report");

  it("loads sponsor-report from sponsor brief sections (TB-1686)", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Sponsor report");
    expect(loaded?.entry.sourcePaths[0]?.toLowerCase()).toContain("executive_sponsor_brief.md");
  });

  it("loads sponsor-report with pilot ROI measurement section from scorecard", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.markdown.toLowerCase()).toContain("pilot roi measurement");
    expect(loaded?.markdown.toLowerCase()).toContain("baseline questions");
  });

  it("purges FAQ dump leakage and renders sponsor framing with primary CTA (TB-1687, TB-1690)", () => {
    if (loaded === null) {
      throw new Error("Expected sponsor-report documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(
      loaded.markdown,
      sourcePath,
      { helpTopicSlug: loaded.entry.slug },
    ).toLowerCase();

    for (const banned of SPONSOR_SUMMARY_HELP_BANNED_SUBSTRINGS) {
      expect(preparedMarkdown, `prepared markdown contains "${banned}"`).not.toContain(banned);
    }

    expect(preparedMarkdown).toContain("what pilot proves");
    expect(preparedMarkdown).not.toMatch(/^##\s+\d+\./m);

    render(<HelpSponsorReportGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-sponsor-report-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-sponsor-report-page-title")).toHaveTextContent("Sponsor report");
    expect(screen.getAllByRole("heading", { level: 1, name: "Sponsor report" })).toHaveLength(1);
    expect(screen.queryByTestId("help-sponsor-report-refresh-button")).toBeNull();
    expect(screen.queryByTestId("help-sponsor-report-last-refreshed")).toBeNull();
    expect(screen.queryByTestId("help-sponsor-report-claim-discipline")).toBeNull();
    expect(screen.getByTestId("help-sponsor-report-claim-discipline-strip")).toHaveTextContent(
      SPONSOR_SUMMARY_HELP_CLAIM_DISCIPLINE,
    );
    expectClaimDisciplineBandContent(
      screen,
      "help-sponsor-report",
      "help-sponsor-report-claim-discipline",
      SPONSOR_SUMMARY_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-sponsor-report-source-of-record")).toBeNull();
    expect(screen.getByRole("link", { name: /open sponsor value report/i })).toHaveAttribute(
      "href",
      SPONSOR_REPORT_PATH,
    );

    const contentRegion = screen.getByTestId("help-sponsor-report-content");
    const numberedHeadings = within(contentRegion)
      .getAllByRole("heading")
      .filter((heading) => /^\d+\./.test(heading.textContent ?? ""));
    expect(numberedHeadings).toHaveLength(0);

    const pilotRoiLinks = screen.getAllByRole("link", { name: /Sponsor ROI methodology/i });
    expect(pilotRoiLinks.length).toBeGreaterThan(0);
    for (const link of pilotRoiLinks) {
      expect(link.getAttribute("href")).toMatch(
        /^(\/help\/sponsor-report#pilot-roi-measurement|#pilot-roi-measurement)$/,
      );
    }

    expect(screen.queryByText(/\bRoi\b/)).toBeNull();
    expect(screen.queryByText(/\bApi\b/)).toBeNull();
    expect(screen.queryByText(/frequently asked questions/i)).toBeNull();
    expect(screen.queryByText(/last refreshed/i)).toBeNull();
    expect(screen.queryByText(/not refreshed yet/i)).toBeNull();

    const actionPanel = screen.getByTestId("help-sponsor-report-action-panel");
    const overview = screen.getByTestId("help-sponsor-report-overview");
    const claimStrip = screen.getByTestId("help-sponsor-report-claim-discipline-strip");

    expect(claimStrip.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(overview.compareDocumentPosition(actionPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(actionPanel.className).not.toMatch(/bg-teal-/);
    expect(actionPanel.className).not.toMatch(/border-teal-/);
  });
});
