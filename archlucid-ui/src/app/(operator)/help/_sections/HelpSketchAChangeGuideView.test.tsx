import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpSketchAChangeGuideView } from "@/app/(operator)/help/_sections/HelpSketchAChangeGuideView";
import { CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_CLAIM_DISCIPLINE } from "@/lib/cheap-exploration-help-sketch-a-change-evidence-copy";
import {
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_DESK_ENTRY_ROWS,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_GUIDE_HEADINGS,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_HELP_RETURN,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PAGE_SUBTITLE,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RELATED_TOPICS,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SPONSOR_PANEL_SCOPE_LEAD_IN,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_TITLE,
} from "@/lib/cheap-exploration-help-sketch-a-change-guide-content";
import {
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SKIP_LINK_LABEL,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SKIP_TARGET_ID,
} from "@/lib/cheap-exploration-help-sketch-a-change-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpSketchAChangeGuideView (CE-019 / HEK Phase 2)", () => {
  const entry = getProductDocumentationEntry("sketch-a-change");

  it("renders provenance, skip link, practice envelope, desk entry, seal section, and sponsor panel after content", () => {
    if (entry === undefined) {
      throw new Error("Expected sketch-a-change documentation entry.");
    }

    render(<HelpSketchAChangeGuideView entry={entry} markdown="# discarded" />);

    expect(screen.getByTestId("help-sketch-a-change-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-sketch-a-change-page-title")).toHaveTextContent(
      CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_TITLE,
    );
    expect(screen.getByText(CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-09-12");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("CE-019");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("ADR 0092");
    expect(screen.getByTestId("help-sketch-a-change-header-claim-discipline")).toHaveTextContent(
      CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_CLAIM_DISCIPLINE,
    );
    expect(screen.getByRole("link", { name: CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-sketch-a-change-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.queryByText("# discarded")).not.toBeInTheDocument();

    expect(screen.getByTestId("help-sketch-a-change-practice-status-tag")).toHaveTextContent("Practice labeling required");
    expect(screen.getByTestId("help-sketch-a-change-seat-working")).toBeInTheDocument();
    expect(screen.getByTestId("help-sketch-a-change-record-practice")).toHaveTextContent("Practice");
    expect(screen.getByTestId("help-sketch-a-change-record-practice")).toHaveTextContent("Record");

    for (const heading of CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: heading.level, name: heading.title })).toHaveAttribute(
        "id",
        heading.id,
      );
    }

    const deskTable = screen.getByTestId("help-sketch-a-change-desk-entry-table");
    expect(within(deskTable).getAllByRole("row").length).toBe(
      CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_DESK_ENTRY_ROWS.length + 1,
    );

    expect(screen.getByTestId("help-sketch-a-change-seal-compare")).toHaveTextContent("no unseal");
    expect(screen.getByTestId("help-sketch-a-change-adr-mapping")).toHaveTextContent("ADR 0092");

    const related = screen.getByTestId("help-sketch-a-change-related-topics");
    for (const topic of CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RELATED_TOPICS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-sketch-a-change-return-to-help")).toHaveAttribute(
      "href",
      CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_HELP_RETURN.href,
    );

    expect(screen.getByTestId("help-sketch-a-change-sponsor-panel-scope-lead-in")).toHaveTextContent(
      CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SPONSOR_PANEL_SCOPE_LEAD_IN,
    );

    expect(screen.queryByRole("button", { name: /Open architecture desk/i })).not.toBeInTheDocument();

    const sponsorPanel = screen.getByTestId("help-sketch-a-change-honesty-panel");
    expect(related.compareDocumentPosition(sponsorPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
