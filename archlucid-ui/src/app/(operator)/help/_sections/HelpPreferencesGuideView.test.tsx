import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpPreferencesGuideView } from "@/app/(operator)/help/_sections/HelpPreferencesGuideView";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  expectClaimDisciplineBandContent,
  expectClaimDisciplineHeading,
} from "@/lib/claim-discipline-test-helpers";
import {
  PREFERENCES_HELP_CLAIM_DISCIPLINE,
  PREFERENCES_HELP_CLAIM_DISCIPLINE_HEADING,
  PREFERENCES_HELP_SOURCES,
} from "@/lib/preferences-help-evidence-copy";
import {
  PREFERENCES_HELP_CHANGES_SECTION_TITLE,
  PREFERENCES_HELP_CLAIM_HEADING_ID,
  PREFERENCES_HELP_GUIDE_HEADINGS,
  PREFERENCES_HELP_HOW_SECTION_TITLE,
  PREFERENCES_HELP_NEGATION_DRIFT_MARKERS,
  PREFERENCES_HELP_PRIMARY_ACTION,
  PREFERENCES_HELP_START_HERE_CARD_TITLE,
  PREFERENCES_HELP_START_HERE_HELPER,
  PREFERENCES_HELP_TILE_ITEMS,
} from "@/lib/preferences-help-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpPreferencesGuideView", () => {
  const entry = getProductDocumentationEntry("preferences");

  it("renders provenance, role precondition, readingBody, claim discipline, and stacked sources", () => {
    if (entry === undefined) {
      throw new Error("Expected preferences documentation entry.");
    }

    render(<HelpPreferencesGuideView entry={entry} />);

    expect(screen.getByTestId("help-preferences-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Guide last reviewed 2026-08-13 · Scope: personal account settings · Audience: all signed-in users",
    );
    expect(screen.getByTestId("help-preferences-start-here-helper")).toHaveTextContent(
      PREFERENCES_HELP_START_HERE_HELPER,
    );
    expect(screen.queryByTestId("help-preferences-start-here-scope-note")).not.toBeInTheDocument();
    expectClaimDisciplineBandContent(
      screen,
      "help-preferences",
      "help-preferences-claim-discipline",
      PREFERENCES_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("help-preferences-claim-discipline-strip")).toHaveTextContent(
      PREFERENCES_HELP_CLAIM_DISCIPLINE,
    );
    expectClaimDisciplineHeading(
      screen,
      "help-preferences",
      PREFERENCES_HELP_CLAIM_DISCIPLINE_HEADING,
      PREFERENCES_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByTestId("help-preferences-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-preferences-overview").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    for (const phrase of PREFERENCES_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(screen.getByTestId("help-preferences-overview").textContent).not.toContain(phrase);
    }
    expect(screen.getByRole("link", { name: PREFERENCES_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      PREFERENCES_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: PREFERENCES_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: PREFERENCES_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What preferences cover" }).className).toContain(
      OPERATOR_TYPOGRAPHY.sectionTitle.split(" ")[0],
    );
    expect(screen.getByRole("heading", { name: PREFERENCES_HELP_CHANGES_SECTION_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: PREFERENCES_HELP_HOW_SECTION_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-preferences-how-stepper").textContent?.toLowerCase()).not.toContain("api");
    expect(screen.getByTestId("help-preferences-how-stepper").textContent?.toLowerCase()).not.toContain("stacked");

    expect(screen.queryByRole("link", { name: "Users and roles" })).not.toBeInTheDocument();

    const guideHeadings = resolveGuideHeadingsForStrip(
      "help-preferences",
      PREFERENCES_HELP_GUIDE_HEADINGS,
      PREFERENCES_HELP_CLAIM_HEADING_ID,
    );

    for (const item of PREFERENCES_HELP_TILE_ITEMS) {
      expect(within(screen.getByTestId("help-preferences-tile-items")).getByText(item.label)).toBeInTheDocument();
    }

    for (const source of PREFERENCES_HELP_SOURCES) {
      const sourcesRegion = within(screen.getByTestId("help-preferences-sources"));
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(sourcesRegion.getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    for (const heading of guideHeadings) {
      expect(screen.getByRole("heading", { name: heading.title })).toHaveAttribute("id", heading.id);
    }
  });
});
