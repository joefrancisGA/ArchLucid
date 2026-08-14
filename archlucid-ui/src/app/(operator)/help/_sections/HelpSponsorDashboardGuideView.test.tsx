import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/app/(operator)/help/_sections/HelpSponsorDashboardWorkspaceReadinessStrip", () => ({
  HelpSponsorDashboardWorkspaceReadinessStrip: () => (
    <div data-testid="help-sponsor-dashboard-workspace-readiness">
      <div data-testid="help-sponsor-dashboard-workspace-readiness-status">Baseline anchors set</div>
    </div>
  ),
}));

import { HelpSponsorDashboardGuideView } from "@/app/(operator)/help/_sections/HelpSponsorDashboardGuideView";
import {
  SPONSOR_DASHBOARD_HELP_BREADCRUMB_TOPIC_TITLE,
  SPONSOR_DASHBOARD_HELP_CLAIM_HEADING_ID,
  SPONSOR_DASHBOARD_HELP_GUIDE_HEADINGS,
  SPONSOR_DASHBOARD_HELP_PRIMARY_ACTION,
  SPONSOR_DASHBOARD_HELP_SCOPE_PRECONDITION,
  SPONSOR_DASHBOARD_HELP_SCORECARD_HREF,
} from "@/lib/sponsor-dashboard-help-guide-content";
import {
  SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE,
  SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE_HEADING,
  SPONSOR_DASHBOARD_HELP_SOURCES,
} from "@/lib/sponsor-dashboard-help-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpSponsorDashboardGuideView", () => {
  const entry = getProductDocumentationEntry("sponsor-dashboard");

  it("renders breadcrumb, header action, readiness strip, readingBody, and deduped follow-ups", () => {
    if (entry === undefined) {
      throw new Error("Expected sponsor-dashboard documentation entry.");
    }

    render(<HelpSponsorDashboardGuideView entry={entry} />);

    expect(screen.getByTestId("help-sponsor-dashboard-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent(SPONSOR_DASHBOARD_HELP_BREADCRUMB_TOPIC_TITLE);
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-13");
    expect(screen.getByTestId("help-sponsor-dashboard-scope-precondition")).toHaveTextContent(
      SPONSOR_DASHBOARD_HELP_SCOPE_PRECONDITION,
    );
    expect(screen.getByTestId("help-sponsor-dashboard-workspace-readiness")).toBeInTheDocument();
    expect(screen.getByTestId("help-sponsor-dashboard-workspace-readiness-status")).toBeInTheDocument();
    expect(screen.getByTestId("help-sponsor-dashboard-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-sponsor-dashboard-overview").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByTestId("help-sponsor-dashboard-claim-discipline").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByTestId("help-sponsor-dashboard-claim-discipline").textContent).toContain(
      SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      SPONSOR_DASHBOARD_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByRole("link", { name: SPONSOR_DASHBOARD_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      SPONSOR_DASHBOARD_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: SPONSOR_DASHBOARD_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(screen.queryByTestId("help-sponsor-dashboard-action-panel")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Before you start" })).toBeInTheDocument();
    expect(screen.getByTestId("help-sponsor-dashboard-before-you-start")).toBeInTheDocument();

    for (const source of SPONSOR_DASHBOARD_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);

      expect(screen.getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(screen.getAllByRole("link", { name: "Architecture scorecard" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Architecture scorecard" })).toHaveAttribute(
      "href",
      SPONSOR_DASHBOARD_HELP_SCORECARD_HREF,
    );
    expect(screen.queryByRole("link", { name: "Sponsor dashboard" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Read sponsor report help →" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open architecture scorecard →" })).not.toBeInTheDocument();

    for (const heading of SPONSOR_DASHBOARD_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
