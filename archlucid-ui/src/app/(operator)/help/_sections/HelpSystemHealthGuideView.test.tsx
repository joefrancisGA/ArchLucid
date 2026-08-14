import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpSystemHealthGuideView } from "@/app/(operator)/help/_sections/HelpSystemHealthGuideView";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import {
  SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE,
  SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE_HEADING,
  SYSTEM_HEALTH_HELP_SOURCES,
} from "@/lib/system-health-help-evidence-copy";
import {
  SYSTEM_HEALTH_HELP_BREADCRUMB_TOPIC_TITLE,
  SYSTEM_HEALTH_HELP_CLAIM_HEADING_ID,
  SYSTEM_HEALTH_HELP_GUIDE_HEADINGS,
  SYSTEM_HEALTH_HELP_NEGATION_DRIFT_MARKERS,
  SYSTEM_HEALTH_HELP_PRIMARY_ACTION,
  SYSTEM_HEALTH_HELP_READINESS_HELPER,
  SYSTEM_HEALTH_HELP_TILE_ITEMS,
} from "@/lib/system-health-help-guide-content";
import { SYSTEM_HEALTH_HELP_TOPIC_LABEL } from "@/lib/system-health-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpSystemHealthGuideView", () => {
  const entry = getProductDocumentationEntry("system-health");

  it("renders provenance, breadcrumb, header CTA, readiness helper, claim discipline, and stacked sources", () => {
    if (entry === undefined) {
      throw new Error("Expected system-health documentation entry.");
    }

    render(<HelpSystemHealthGuideView entry={entry} />);

    expect(screen.getByTestId("help-system-health-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent(
      SYSTEM_HEALTH_HELP_BREADCRUMB_TOPIC_TITLE,
    );
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-13");
    expect(screen.getByTestId("help-system-health-readiness-helper")).toHaveTextContent(
      SYSTEM_HEALTH_HELP_READINESS_HELPER,
    );
    expect(screen.queryByTestId("help-system-health-action-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-system-health-role-precondition-tag")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-system-health-claim-discipline").textContent).toContain(
      SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      SYSTEM_HEALTH_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByTestId("help-system-health-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    for (const phrase of SYSTEM_HEALTH_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(screen.getByTestId("help-system-health-overview").textContent).not.toContain(phrase);
    }
    expect(screen.getByTestId("help-system-health-primary-cta")).toHaveAttribute(
      "href",
      SYSTEM_HEALTH_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: SYSTEM_HEALTH_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: SYSTEM_HEALTH_HELP_TOPIC_LABEL })).toBeInTheDocument();

    const tileRegion = within(screen.getByTestId("help-system-health-tile-items"));

    for (const item of SYSTEM_HEALTH_HELP_TILE_ITEMS) {
      if (item.href === undefined) {
        expect(tileRegion.queryByRole("link", { name: item.label })).not.toBeInTheDocument();
        expect(tileRegion.getByText(item.label)).toBeInTheDocument();
      } else {
        expect(tileRegion.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
      }
    }

    for (const source of SYSTEM_HEALTH_HELP_SOURCES) {
      const sourcesRegion = within(screen.getByTestId("help-system-health-sources"));
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);

      expect(sourcesRegion.getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
      if (source.when !== undefined) {
        expect(sourcesRegion.getByText(source.when)).toBeInTheDocument();
      }
    }

    expect(screen.queryByRole("link", { name: "Read troubleshooting help →" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Read connection status help →" })).not.toBeInTheDocument();

    for (const heading of SYSTEM_HEALTH_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { name: heading.title })).toHaveAttribute("id", heading.id);
    }
  });
});
