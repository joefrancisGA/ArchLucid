import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpSystemHealthGuideView } from "@/app/(operator)/help/_sections/HelpSystemHealthGuideView";
import {
  SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE,
  SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE_HEADING,
  SYSTEM_HEALTH_HELP_SOURCES,
} from "@/lib/system-health-help-evidence-copy";
import {
  SYSTEM_HEALTH_HELP_CLAIM_HEADING_ID,
  SYSTEM_HEALTH_HELP_GUIDE_HEADINGS,
  SYSTEM_HEALTH_HELP_NEGATION_DRIFT_MARKERS,
  SYSTEM_HEALTH_HELP_PRIMARY_ACTION,
  SYSTEM_HEALTH_HELP_ROLE_PRECONDITION,
  SYSTEM_HEALTH_HELP_ROLE_PRECONDITION_TAG,
  SYSTEM_HEALTH_HELP_START_HERE_CARD_TITLE,
  SYSTEM_HEALTH_HELP_TILE_ITEMS,
} from "@/lib/system-health-help-guide-content";
import { SYSTEM_HEALTH_HELP_TOPIC_LABEL } from "@/lib/system-health-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpSystemHealthGuideView", () => {
  const entry = getProductDocumentationEntry("system-health");

  it("renders provenance, role precondition, readingBody, claim discipline, and stacked sources", () => {
    if (entry === undefined) {
      throw new Error("Expected system-health documentation entry.");
    }

    render(<HelpSystemHealthGuideView entry={entry} />);

    expect(screen.getByTestId("help-system-health-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Last reviewed 2026-08-13 · administration system health orientation",
    );
    expect(screen.getByTestId("help-system-health-role-precondition")).toHaveTextContent(
      SYSTEM_HEALTH_HELP_ROLE_PRECONDITION,
    );
    expect(screen.getByTestId("help-system-health-role-precondition-tag")).toHaveTextContent(
      SYSTEM_HEALTH_HELP_ROLE_PRECONDITION_TAG,
    );
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
    expect(screen.getByRole("link", { name: SYSTEM_HEALTH_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      SYSTEM_HEALTH_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: SYSTEM_HEALTH_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: SYSTEM_HEALTH_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: SYSTEM_HEALTH_HELP_TOPIC_LABEL })).toBeInTheDocument();

    for (const item of SYSTEM_HEALTH_HELP_TILE_ITEMS) {
      expect(within(screen.getByTestId("help-system-health-tile-items")).getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        item.href,
      );
    }

    for (const source of SYSTEM_HEALTH_HELP_SOURCES) {
      const sourcesRegion = within(screen.getByTestId("help-system-health-sources"));
      expect(sourcesRegion.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    expect(screen.queryByRole("link", { name: "Read troubleshooting help →" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Read connection status help →" })).not.toBeInTheDocument();

    for (const heading of SYSTEM_HEALTH_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { name: heading.title })).toHaveAttribute("id", heading.id);
    }
  });
});
