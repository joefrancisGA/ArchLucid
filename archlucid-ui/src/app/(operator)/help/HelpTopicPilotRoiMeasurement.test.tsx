import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpExecutiveSummaryGuideView } from "@/app/(operator)/help/_sections/HelpExecutiveSummaryGuideView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import {
  PILOT_ROI_MEASUREMENT_HELP_PRIMARY_ACTIONS,
  PILOT_ROI_MEASUREMENT_HELP_SECTION_TITLE,
} from "@/lib/executive/pilot-roi-measurement-help-guide-content";
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

const PILOT_ROI_MEASUREMENT_HELP_BANNED_SUBSTRINGS = [
  "ReadyForCommit",
  "Create review → Execute → Finalize",
  "docs/library/PILOT_ROI_MODEL.md",
  "API/CLI may still say",
] as const;

describe("HelpTopicPilotRoiMeasurement (TB-1391–TB-1393)", () => {
  const loaded = tryLoadProductDocumentation("executive-summary");

  it("renders sponsor ROI methodology specialty chrome with baseline CTA before scorecard", () => {
    if (loaded === null) {
      throw new Error("Expected executive-summary documentation to load.");
    }

    render(<HelpExecutiveSummaryGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const section = screen.getByTestId("help-pilot-roi-measurement-section");
    const actionPanel = screen.getByTestId("help-pilot-roi-measurement-action-panel");
    const scorecard = within(section).getByTestId("pilot-roi-measurement-scorecard");

    expect(screen.getByRole("heading", { name: PILOT_ROI_MEASUREMENT_HELP_SECTION_TITLE })).toBeInTheDocument();
    expect(within(actionPanel).getByRole("link", { name: PILOT_ROI_MEASUREMENT_HELP_PRIMARY_ACTIONS.setBaseline.label })).toHaveAttribute(
      "href",
      PILOT_ROI_MEASUREMENT_HELP_PRIMARY_ACTIONS.setBaseline.href,
    );
    expect(actionPanel.compareDocumentPosition(scorecard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId("help-pilot-roi-measurement-anti-overclaim")).toBeInTheDocument();
  });

  it("purges execute/commit engineering vocabulary from prepared pilot ROI measurement copy (TB-1391)", () => {
    if (loaded === null) {
      throw new Error("Expected executive-summary documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, loaded.entry.sourcePaths[0] ?? "", {
      helpTopicSlug: loaded.entry.slug,
    }).toLowerCase();

    for (const banned of PILOT_ROI_MEASUREMENT_HELP_BANNED_SUBSTRINGS) {
      expect(preparedMarkdown, `prepared markdown contains "${banned}"`).not.toContain(banned.toLowerCase());
    }

    render(<HelpExecutiveSummaryGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    for (const banned of PILOT_ROI_MEASUREMENT_HELP_BANNED_SUBSTRINGS) {
      expect(visible, `rendered copy contains "${banned}"`).not.toContain(banned.toLowerCase());
    }

    expect(screen.getByTestId("help-pilot-roi-measurement-lifecycle")).toHaveTextContent(/request → finalize → review exports/i);
  });

  it("keeps executive summary sponsor CTAs above the ROI methodology section", () => {
    if (loaded === null) {
      throw new Error("Expected executive-summary documentation to load.");
    }

    render(<HelpExecutiveSummaryGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const executiveActionPanel = screen.getByTestId("help-executive-summary-action-panel");
    const roiSection = screen.getByTestId("help-pilot-roi-measurement-section");

    expect(
      within(executiveActionPanel).getByRole("link", { name: /open executive value report/i }),
    ).toHaveAttribute("href", SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH);
    expect(executiveActionPanel.compareDocumentPosition(roiSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
