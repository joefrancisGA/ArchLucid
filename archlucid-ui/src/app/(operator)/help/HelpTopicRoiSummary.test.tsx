import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpRoiSummaryGuideView } from "@/app/(operator)/help/_sections/HelpRoiSummaryGuideView";
import { SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF } from "@/lib/sponsor/sponsor-report-pilot-roi-measurement-help";
import {
  ROI_SUMMARY_HELP_CLAIM_DISCIPLINE,
  ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE,
  ROI_SUMMARY_HELP_SOURCES,
} from "@/lib/roi-summary-help-evidence-copy";
import {
  ROI_SUMMARY_HELP_OVERVIEW,
  ROI_SUMMARY_HELP_PAGE_SUBTITLE,
  ROI_SUMMARY_HELP_PAGE_TITLE,
  ROI_SUMMARY_HELP_PRIMARY_ACTION,
  ROI_SUMMARY_HELP_REPORT_ITEMS,
  ROI_SUMMARY_HELP_SIBLING_REPORTS,
} from "@/lib/roi-summary-help-guide-content";
import { SPONSOR_REPORT_ROI_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpRoiSummaryGuideView", () => {
  const entry = getProductDocumentationEntry("roi-summary");

  it("registers the ROI summary help guide entry", () => {
    expect(entry?.slug).toBe("roi-summary");
    expect(entry?.title).toBe(ROI_SUMMARY_HELP_PAGE_TITLE);
    expect(entry?.summary).toBe(
      "Portfolio KPI framing for review-cycle reduction, effort saved, and governance-ready artifacts.",
    );
    expect(entry?.lastReviewed).toBe("2026-08-12");
    expect(entry?.releaseApplicability).toBe("sponsor ROI summary orientation");
  });

  it("shows breadcrumb, overview first, and buyer-safe section order", () => {
    if (entry === undefined) {
      throw new Error("Expected ROI summary documentation entry.");
    }

    render(<HelpRoiSummaryGuideView entry={entry} />);

    const breadcrumb = screen.getByTestId("help-roi-summary-breadcrumb");
    expect(breadcrumb).toHaveTextContent("Help");
    expect(breadcrumb).toHaveTextContent(ROI_SUMMARY_HELP_PAGE_TITLE);
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");

    expect(screen.getByRole("heading", { level: 1, name: ROI_SUMMARY_HELP_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(ROI_SUMMARY_HELP_PAGE_SUBTITLE)).toBeInTheDocument();

    const overview = screen.getByTestId("help-roi-summary-overview");
    const followUpsHeading = screen.getByRole("heading", { name: ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE });

    expect(overview).toHaveTextContent(ROI_SUMMARY_HELP_OVERVIEW);
    expect(overview.compareDocumentPosition(followUpsHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows report items, methodology, vocabulary rails, and sibling reports", () => {
    if (entry === undefined) {
      throw new Error("Expected ROI summary documentation entry.");
    }

    render(<HelpRoiSummaryGuideView entry={entry} />);

    const reportItems = screen.getByTestId("help-roi-summary-report-items");
    for (const item of ROI_SUMMARY_HELP_REPORT_ITEMS) {
      expect(within(reportItems).getByText(item.label)).toBeInTheDocument();
      expect(within(reportItems).getByText(item.detail)).toBeInTheDocument();
    }

    expect(screen.getByTestId("help-roi-summary-methodology")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review pilot ROI measurement methodology" })).toHaveAttribute(
      "href",
      SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF,
    );
    expect(screen.getByTestId("scorecard-roi-vocabulary")).toBeInTheDocument();
    expect(screen.getByTestId("baseline-roi-vocabulary")).toBeInTheDocument();

    const siblingReports = screen.getByTestId("help-roi-summary-sibling-reports");
    for (const report of ROI_SUMMARY_HELP_SIBLING_REPORTS) {
      expect(within(siblingReports).getByText(report.title)).toBeInTheDocument();
      expect(within(siblingReports).getByRole("link", { name: report.actionLabel })).toHaveAttribute(
        "href",
        report.href,
      );
    }
  });

  it("shows claim discipline once and cross-topic follow-up links", () => {
    if (entry === undefined) {
      throw new Error("Expected ROI summary documentation entry.");
    }

    render(<HelpRoiSummaryGuideView entry={entry} />);

    expect(screen.getByTestId("help-roi-summary-claim-discipline")).toHaveTextContent(ROI_SUMMARY_HELP_CLAIM_DISCIPLINE);
    expect(screen.getByRole("heading", { name: ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const followUps = screen.getByTestId("help-roi-summary-sources");
    for (const source of ROI_SUMMARY_HELP_SOURCES) {
      expect(within(followUps).getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });

  it("links the primary action to ROI summary", () => {
    if (entry === undefined) {
      throw new Error("Expected ROI summary documentation entry.");
    }

    render(<HelpRoiSummaryGuideView entry={entry} />);

    const actionPanel = screen.getByTestId("help-roi-summary-action-panel");

    expect(within(actionPanel).getByRole("link", { name: ROI_SUMMARY_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      SPONSOR_REPORT_ROI_SUMMARY_PATH,
    );
    expect(ROI_SUMMARY_HELP_PRIMARY_ACTION.href).toBe(SPONSOR_REPORT_ROI_SUMMARY_PATH);
    expect(within(actionPanel).getAllByRole("link")).toHaveLength(1);
  });

  it("renders how-to-read steps and TOC rail", () => {
    if (entry === undefined) {
      throw new Error("Expected ROI summary documentation entry.");
    }

    render(<HelpRoiSummaryGuideView entry={entry} />);

    expect(screen.getByRole("heading", { name: "How to read ROI summary" })).toBeInTheDocument();
    expect(screen.getByTestId("help-roi-summary-how-stepper")).toBeInTheDocument();
    expect(screen.getByTestId("help-roi-summary-guide").textContent).not.toMatch(/\bSources\b/);
  });
});
