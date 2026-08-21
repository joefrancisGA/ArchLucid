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
  HOURS_PER_CRITICAL,
  HOURS_PER_HIGH,
  HOURS_PER_MEDIUM,
  HOURS_PER_PRECOMMIT_BLOCK,
  ROI_HOURS_COEFFICIENTS_PROVENANCE,
} from "@/lib/roi-assumptions";
import {
  ROI_SUMMARY_HELP_DATA_NEEDS_ITEMS,
  ROI_SUMMARY_HELP_GUIDE_HEADINGS,
  ROI_SUMMARY_HELP_HOW_TO_READ_STEPS,
  ROI_SUMMARY_HELP_METHODOLOGY_COEFFICIENT_ROWS,
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
import { formatHelpTopicApplicabilityMetadata } from "@/lib/help/help-topic-applicability-metadata";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { roiSummaryMethodologyFormula } from "@/lib/roi-summary-sponsor-presentation";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpRoiSummaryGuideView", () => {
  const entry = getProductDocumentationEntry("roi-summary");

  it("registers the ROI summary help guide entry", () => {
    expect(entry?.slug).toBe("roi-summary");
    expect(entry?.title).toBe(ROI_SUMMARY_HELP_PAGE_TITLE);
    expect(entry?.summary).toBe(
      "Portfolio KPI framing for review-cycle reduction, effort saved, and export-ready artifacts.",
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
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      formatHelpTopicApplicabilityMetadata(entry)!,
    );

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
    const coefficients = screen.getByTestId("help-roi-summary-methodology-coefficients");

    expect(methodology).toBeInTheDocument();
    expect(formula).toHaveTextContent(roiSummaryMethodologyFormula());
    expect(coefficients).toBeInTheDocument();
    expect(formula.compareDocumentPosition(coefficients) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(formula.className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(formula.className).not.toContain("font-mono");
    expect(coefficients.className).toContain(HELP_PAGE_LAYOUT.table);

    expect(screen.getByRole("link", { name: "Review pilot ROI measurement methodology" })).toHaveAttribute(
      "href",
      SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF,
    );
    expect(screen.getByRole("heading", { name: ROI_SUMMARY_HELP_NEARBY_SURFACES_SECTION_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("scorecard-roi-vocabulary")).toHaveAttribute("data-variant", "full");
    expect(screen.getByTestId("baseline-roi-vocabulary")).toHaveAttribute("data-variant", "full");

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
    expect(screen.getByRole("heading", { name: ROI_SUMMARY_HELP_CLAIM_DISCIPLINE_HEADING }).className).toContain(
      OPERATOR_TYPOGRAPHY.sectionTitle,
    );
    expect(screen.getByRole("heading", { name: ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(siblingReports.compareDocumentPosition(claimDiscipline) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

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
    expect(
      screen.getByTestId("help-roi-summary-start-here-helper").compareDocumentPosition(
        within(actionPanel).getByRole("link", { name: ROI_SUMMARY_HELP_PRIMARY_ACTION.label }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders readingBody, how-to-read steps, and TOC rail", () => {
    if (entry === undefined) {
      throw new Error("Expected ROI summary documentation entry.");
    }

    render(<HelpRoiSummaryGuideView entry={entry} />);

    expect(screen.getByTestId("help-roi-summary-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-roi-summary-report-items").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-roi-summary-data-needs").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByRole("heading", { name: "How to read ROI summary" })).toBeInTheDocument();
    expect(screen.getByTestId("help-roi-summary-how-stepper")).toBeInTheDocument();
    expect(screen.getByTestId("help-roi-summary-guide").textContent).not.toMatch(/\bSources\b/);

    for (const heading of ROI_SUMMARY_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { name: heading.title })).toHaveAttribute("id", heading.id);
    }

    const orderedHeadings = ROI_SUMMARY_HELP_GUIDE_HEADINGS.map((heading) =>
      screen.getByRole("heading", { name: heading.title }),
    );

    for (let index = 0; index < orderedHeadings.length - 1; index += 1) {
      expect(
        orderedHeadings[index].compareDocumentPosition(orderedHeadings[index + 1]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("points loaded hourly cost to the ROI summary page and discloses local-only storage", () => {
    if (entry === undefined) {
      throw new Error("Expected ROI summary documentation entry.");
    }

    render(<HelpRoiSummaryGuideView entry={entry} />);

    expect(ROI_SUMMARY_HELP_HOW_TO_READ_STEPS[2]).toMatch(/ROI summary page/i);
    expect(ROI_SUMMARY_HELP_HOW_TO_READ_STEPS[2]).not.toMatch(/baseline settings/i);

    const stepper = screen.getByTestId("help-roi-summary-how-stepper");
    expect(within(stepper).getByText(ROI_SUMMARY_HELP_HOW_TO_READ_STEPS[2])).toBeInTheDocument();

    const dataNeeds = screen.getByTestId("help-roi-summary-data-needs");
    for (const item of ROI_SUMMARY_HELP_DATA_NEEDS_ITEMS) {
      expect(within(dataNeeds).getByText(item)).toBeInTheDocument();
    }

    expect(dataNeeds).toHaveTextContent(/browser only/i);
    expect(dataNeeds.textContent).not.toMatch(/baseline settings.*loaded hourly cost/i);
  });

  it("renders basis-of-estimate values from roi-assumptions constants", () => {
    if (entry === undefined) {
      throw new Error("Expected ROI summary documentation entry.");
    }

    render(<HelpRoiSummaryGuideView entry={entry} />);

    const methodology = screen.getByTestId("help-roi-summary-methodology");
    expect(methodology).toHaveTextContent(ROI_HOURS_COEFFICIENTS_PROVENANCE);
    const coefficients = screen.getByTestId("help-roi-summary-methodology-coefficients");
    expect(within(coefficients).getByText(String(HOURS_PER_CRITICAL))).toBeInTheDocument();
    expect(within(coefficients).getByText(String(HOURS_PER_HIGH))).toBeInTheDocument();
    expect(within(coefficients).getByText(String(HOURS_PER_MEDIUM))).toBeInTheDocument();
    expect(within(coefficients).getByText(String(HOURS_PER_PRECOMMIT_BLOCK))).toBeInTheDocument();
    for (const row of ROI_SUMMARY_HELP_METHODOLOGY_COEFFICIENT_ROWS) {
      expect(within(coefficients).getByText(String(row.hours))).toBeInTheDocument();
    }
  });

  it("does not duplicate destination hrefs or accessible names on the guide", () => {
    if (entry === undefined) {
      throw new Error("Expected ROI summary documentation entry.");
    }

    render(<HelpRoiSummaryGuideView entry={entry} />);

    const guide = screen.getByTestId("help-roi-summary-guide");
    const links = within(guide).getAllByRole("link");
    const hrefCounts = new Map<string, number>();
    const nameToHref = new Map<string, string>();

    for (const link of links) {
      const href = link.getAttribute("href");

      if (href !== null && href.length > 0 && !href.startsWith("#")) {
        hrefCounts.set(href, (hrefCounts.get(href) ?? 0) + 1);
      }

      const name = link.textContent?.trim() ?? "";

      if (name.length === 0) {
        continue;
      }

      const priorHref = nameToHref.get(name);

      if (priorHref !== undefined) {
        expect(priorHref).toBe(href);
      } else {
        nameToHref.set(name, href ?? "");
      }
    }

    for (const [href, count] of hrefCounts.entries()) {
      expect(count, `duplicate href ${href}`).toBe(1);
    }
  });

  it("does not use w-full on sibling report buttons", () => {
    if (entry === undefined) {
      throw new Error("Expected ROI summary documentation entry.");
    }

    render(<HelpRoiSummaryGuideView entry={entry} />);

    const siblingReports = screen.getByTestId("help-roi-summary-sibling-reports");

    for (const link of within(siblingReports).getAllByRole("link")) {
      expect(link.className.split(/\s+/)).not.toContain("w-full");
    }
  });
});
