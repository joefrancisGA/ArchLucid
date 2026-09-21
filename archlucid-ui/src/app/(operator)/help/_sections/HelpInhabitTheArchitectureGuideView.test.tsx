import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/help/InhabitHelpCurrentDeskContextPanel", () => ({
  InhabitHelpCurrentDeskContextPanel: () => (
    <section data-testid="help-inhabit-the-architecture-current-desk" id="help-inhabit-the-architecture-current-desk">
      <h2 id="help-inhabit-the-architecture-current-desk">Your current desk context</h2>
    </section>
  ),
}));

import { HelpInhabitTheArchitectureGuideView } from "@/app/(operator)/help/_sections/HelpInhabitTheArchitectureGuideView";
import { INHABIT_THE_ARCHITECTURE_HELP_CLAIM_DISCIPLINE } from "@/lib/inhabit/inhabit-help-evidence-copy";
import {
  INHABIT_THE_ARCHITECTURE_HELP_GUIDE_HEADINGS,
  INHABIT_THE_ARCHITECTURE_HELP_HELP_RETURN,
  INHABIT_THE_ARCHITECTURE_HELP_KEYBOARD_SHORTCUT_BODY,
  INHABIT_THE_ARCHITECTURE_HELP_PAGE_TITLE,
  INHABIT_THE_ARCHITECTURE_HELP_RECORD_PRACTICE_TOPIC_LABEL,
  INHABIT_THE_ARCHITECTURE_HELP_RELATED_TOPICS,
} from "@/lib/inhabit/inhabit-help-guide-content";
import {
  INHABIT_THE_ARCHITECTURE_HELP_SKIP_LINK_LABEL,
  INHABIT_THE_ARCHITECTURE_HELP_SKIP_TARGET_ID,
} from "@/lib/inhabit/inhabit-help-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpInhabitTheArchitectureGuideView (IH-014 / HIN Phase 2)", () => {
  const entry = getProductDocumentationEntry("inhabit-the-architecture");

  it("renders provenance, skip link, claim discipline, comparison table, shortcuts, and related links", () => {
    if (entry === undefined) {
      throw new Error("Expected inhabit-the-architecture documentation entry.");
    }

    render(<HelpInhabitTheArchitectureGuideView entry={entry} markdown="# discarded" />);

    expect(screen.getByTestId("help-inhabit-the-architecture-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-inhabit-the-architecture-page-title")).toHaveTextContent(
      INHABIT_THE_ARCHITECTURE_HELP_PAGE_TITLE,
    );
    expect(screen.getByTestId("help-inhabit-the-architecture-header-claim-discipline")).toHaveTextContent(
      INHABIT_THE_ARCHITECTURE_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.getByRole("link", { name: INHABIT_THE_ARCHITECTURE_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${INHABIT_THE_ARCHITECTURE_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-inhabit-the-architecture-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.queryByText("# discarded")).not.toBeInTheDocument();

    for (const heading of INHABIT_THE_ARCHITECTURE_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: heading.level, name: heading.title })).toHaveAttribute(
        "id",
        heading.id,
      );
    }

    expect(screen.getByTestId("help-inhabit-the-architecture-comparison-table")).toBeInTheDocument();
    expect(screen.getByTestId("help-inhabit-the-architecture-comparison-row-technical-id")).toHaveTextContent("career");
    expect(screen.getByTestId("help-inhabit-the-architecture-technical-mapping")).toHaveTextContent("ADR 0100");
    expect(screen.getByTestId("help-inhabit-the-architecture-keyboard-shortcut")).toHaveTextContent(
      INHABIT_THE_ARCHITECTURE_HELP_KEYBOARD_SHORTCUT_BODY,
    );
    expect(screen.getByTestId("help-inhabit-the-architecture-practice-cannot-promote")).toBeInTheDocument();
    expect(screen.getByTestId("help-inhabit-the-architecture-sealing-path")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: `${INHABIT_THE_ARCHITECTURE_HELP_RECORD_PRACTICE_TOPIC_LABEL} →` })).toHaveAttribute(
      "href",
      "/help/career-vs-rehearsal",
    );

    const related = screen.getByTestId("help-inhabit-the-architecture-related-topics");
    for (const topic of INHABIT_THE_ARCHITECTURE_HELP_RELATED_TOPICS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-inhabit-the-architecture-return-to-help")).toHaveAttribute(
      "href",
      INHABIT_THE_ARCHITECTURE_HELP_HELP_RETURN.href,
    );

    expect(screen.getByTestId("help-inhabit-the-architecture-tile-doors")).toHaveAttribute("id", "inhabit-concept-doors");
    expect(screen.queryByRole("button", { name: /Open architecture desk help/i })).not.toBeInTheDocument();

    const relatedSection = screen.getByTestId("help-inhabit-the-architecture-related-topics");
    const sponsorPanel = screen.getByTestId("help-inhabit-the-architecture-honesty-panel");
    expect(relatedSection.compareDocumentPosition(sponsorPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
