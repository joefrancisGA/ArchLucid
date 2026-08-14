import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpRoiSummaryGuideView } from "@/app/(operator)/help/_sections/HelpRoiSummaryGuideView";
import { SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF } from "@/lib/sponsor/sponsor-report-pilot-roi-measurement-help";
import {
  ROI_SUMMARY_HELP_CLAIM_DISCIPLINE,
  ROI_SUMMARY_HELP_CLAIM_DISCIPLINE_HEADING,
  ROI_SUMMARY_HELP_CLAIM_HEADING_ID,
  ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE,
  ROI_SUMMARY_HELP_SOURCES,
} from "@/lib/roi-summary-help-evidence-copy";
import {
  ROI_SUMMARY_HELP_BREADCRUMB_TOPIC_TITLE,
  ROI_SUMMARY_HELP_GUIDE_HEADINGS,
  ROI_SUMMARY_HELP_METHODOLOGY_UNITS,
  ROI_SUMMARY_HELP_NEARBY_SURFACES_SECTION_TITLE,
  ROI_SUMMARY_HELP_OVERVIEW,
  ROI_SUMMARY_HELP_PAGE_SUBTITLE,
  ROI_SUMMARY_HELP_PAGE_TITLE,
  ROI_SUMMARY_HELP_PRIMARY_ACTION,
  ROI_SUMMARY_HELP_REPORT_ITEMS,
  ROI_SUMMARY_HELP_SIBLING_REPORTS,
  ROI_SUMMARY_HELP_START_HERE_CARD_TITLE,
  ROI_SUMMARY_HELP_START_HERE_HELPER,
} from "@/lib/roi-summary-help-guide-content";
import { SPONSOR_REPORT_ROI_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
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

  it("shows overview first and buyer-safe section order", () => {
    if (entry === undefined) {
      throw new Error("Expected ROI summary documentation entry.");
    }

    render(<HelpRoiSummaryGuideView entry={entry} />);

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

    const methodology = screen.getByTestId("help-roi-summary-methodology");
    const formula = screen.getByTestId("help-roi-summary-methodology-formula");
    const units = screen.getByTestId("help-roi-summary-methodology-units");

    expect(methodology).toBeInTheDocument();
    expect(formula).toHaveTextContent(/\d+×Critical/);
    expect(units).toHaveTextContent(ROI_SUMMARY_HELP_METHODOLOGY_UNITS);
    expect(formula.compareDocumentPosition(units) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(formula.className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(formula.className).not.toContain("font-mono");

    expect(screen.getByRole("link", { name: "Review pilot ROI measurement methodology" })).toHaveAttribute(
      "href",
      SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF,
    );
    expect(screen.getByRole("heading", { name: ROI_SUMMARY_HELP_NEARBY_SURFACES_SECTION_TITLE })).toBeInTheDocument();
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

    const claimDiscipline = screen.getByTestId("help-roi-summary-claim-discipline");
    const siblingReports = screen.getByTestId("help-roi-summary-sibling-reports");

    expect(claimDiscipline).toHaveTextContent(ROI_SUMMARY_HELP_CLAIM_DISCIPLINE);
    expect(screen.getByRole("heading", { name: ROI_SUMMARY_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      ROI_SUMMARY_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByRole("heading", { name: ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(claimDiscipline.compareDocumentPosition(siblingReports) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const followUps = screen.getByTestId("help-roi-summary-sources");
    for (const source of ROI_SUMMARY_HELP_SOURCES) {
      expect(within(followUps).getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });

  it("links the primary action to ROI summary with a distinct start-here card", () => {
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
    expect(screen.getAllByRole("link", { name: ROI_SUMMARY_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: ROI_SUMMARY_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("help-roi-summary-start-here-helper")).toHaveTextContent(
      ROI_SUMMARY_HELP_START_HERE_HELPER,
    );
  });

  it("renders breadcrumb, readingBody, how-to-read steps, and TOC rail", () => {
    if (entry === undefined) {
      throw new Error("Expected ROI summary documentation entry.");
    }

    render(<HelpRoiSummaryGuideView entry={entry} />);

    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toHaveTextContent(
      HELP_TOPIC_BREADCRUMB_HUB_LABEL,
    );
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent(ROI_SUMMARY_HELP_BREADCRUMB_TOPIC_TITLE);
    expect(screen.getByTestId("help-roi-summary-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-roi-summary-report-items").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-roi-summary-data-needs").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByRole("heading", { name: "How to read ROI summary" })).toBeInTheDocument();
    expect(screen.getByTestId("help-roi-summary-how-stepper")).toBeInTheDocument();
    expect(screen.getByTestId("help-roi-summary-guide").textContent).not.toMatch(/\bSources\b/);

    for (const heading of ROI_SUMMARY_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { name: heading.title })).toHaveAttribute("id", heading.id);
    }
  });
});
