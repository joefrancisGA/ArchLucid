import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpArchitectureScorecardGuideView } from "@/app/(operator)/help/_sections/HelpArchitectureScorecardGuideView";
import { REVIEW_SCORECARD_PAGE_TITLE } from "@/lib/pilot-scorecard-present";
import { SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF } from "@/lib/sponsor/sponsor-report-pilot-roi-measurement-help";
import {
  ARCHITECTURE_SCORECARD_HELP_OVERVIEW,
  ARCHITECTURE_SCORECARD_HELP_PAGE_SUBTITLE,
  ARCHITECTURE_SCORECARD_HELP_PAGE_TITLE,
  ARCHITECTURE_SCORECARD_HELP_PRIMARY_ACTION,
  ARCHITECTURE_SCORECARD_HELP_SIBLING_REPORTS,
  ARCHITECTURE_SCORECARD_HELP_TILE_ITEMS,
  ARCHITECTURE_SCORECARD_HELP_WORKED_EXAMPLE_TITLE,
} from "@/lib/architecture-scorecard-help-guide-content";
import {
  ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE,
  ARCHITECTURE_SCORECARD_HELP_SOURCES,
} from "@/lib/architecture-scorecard-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpArchitectureScorecardGuideView", () => {
  const entry = getProductDocumentationEntry("architecture-scorecard");

  it("registers the architecture scorecard help guide entry", () => {
    expect(entry?.slug).toBe("architecture-scorecard");
    expect(entry?.title).toBe("Architecture scorecard");
    expect(entry?.lastReviewed).toBe("2026-08-12");
    expect(entry?.releaseApplicability).toBe("sponsor architecture scorecard orientation");
  });

  it("uses a help-specific title distinct from the product page", () => {
    if (entry === undefined) {
      throw new Error("Expected architecture scorecard documentation entry.");
    }

    render(<HelpArchitectureScorecardGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: ARCHITECTURE_SCORECARD_HELP_PAGE_TITLE })).toBeInTheDocument();
    expect(ARCHITECTURE_SCORECARD_HELP_PAGE_TITLE).not.toBe(REVIEW_SCORECARD_PAGE_TITLE);
    expect(screen.getByText(ARCHITECTURE_SCORECARD_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-12");
  });

  it("shows overview, tiles, worked example, and sibling reports without duplicate where-to-go-next headings", () => {
    if (entry === undefined) {
      throw new Error("Expected architecture scorecard documentation entry.");
    }

    render(<HelpArchitectureScorecardGuideView entry={entry} />);

    expect(screen.getByTestId("help-architecture-scorecard-overview")).toHaveTextContent(
      ARCHITECTURE_SCORECARD_HELP_OVERVIEW,
    );
    expect(screen.queryByTestId("help-architecture-scorecard-action-panel")).toBeNull();
    expect(screen.getByTestId("help-architecture-scorecard-primary-action")).toBeInTheDocument();

    const tileItems = screen.getByTestId("help-architecture-scorecard-tile-items");
    for (const item of ARCHITECTURE_SCORECARD_HELP_TILE_ITEMS) {
      expect(within(tileItems).getByText(item.label)).toBeInTheDocument();
      expect(within(tileItems).getByText(item.detail)).toBeInTheDocument();
    }

    expect(screen.getByTestId("help-architecture-scorecard-worked-example")).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURE_SCORECARD_HELP_WORKED_EXAMPLE_TITLE)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Review pilot ROI measurement methodology/ })).toHaveAttribute(
      "href",
      SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF,
    );

    const siblingReports = screen.getByTestId("help-architecture-scorecard-sibling-reports");
    for (const report of ARCHITECTURE_SCORECARD_HELP_SIBLING_REPORTS) {
      expect(within(siblingReports).getByText(report.title)).toBeInTheDocument();
      expect(within(siblingReports).getByRole("link", { name: report.actionLabel })).toHaveAttribute(
        "href",
        report.href,
      );
    }

    expect(screen.getAllByRole("heading", { name: "Where to go next" })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-architecture-scorecard-claim-discipline")).toBeInTheDocument();
  });

  it("links the primary action and related evidence without self-referential scorecard links", () => {
    if (entry === undefined) {
      throw new Error("Expected architecture scorecard documentation entry.");
    }

    render(<HelpArchitectureScorecardGuideView entry={entry} />);

    const primaryAction = screen.getByTestId("help-architecture-scorecard-primary-action");
    expect(within(primaryAction).getByRole("link", { name: ARCHITECTURE_SCORECARD_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      ARCHITECTURE_SCORECARD_HELP_PRIMARY_ACTION.href,
    );

    const relatedSources = screen.getByTestId("help-architecture-scorecard-sources");
    for (const source of ARCHITECTURE_SCORECARD_HELP_SOURCES) {
      expect(within(relatedSources).getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });
});
