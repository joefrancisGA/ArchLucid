import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpImprovementPlanningGuideView } from "@/app/(operator)/help/_sections/HelpImprovementPlanningGuideView";
import {
  IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE,
  IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE_HEADING,
  IMPROVEMENT_PLANNING_HELP_SOURCES,
} from "@/lib/improvement-planning-help-evidence-copy";
import {
  IMPROVEMENT_PLANNING_HELP_FEEDBACK_PRECONDITION,
  IMPROVEMENT_PLANNING_HELP_FEEDBACK_PRECONDITION_TAG,
  IMPROVEMENT_PLANNING_HELP_OUTPUT_TILE_ITEMS,
  IMPROVEMENT_PLANNING_HELP_PRIMARY_ACTION,
  IMPROVEMENT_PLANNING_HELP_SHOW_TILE_ITEMS,
  IMPROVEMENT_PLANNING_HELP_START_HERE_CARD_TITLE,
} from "@/lib/improvement-planning-help-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpImprovementPlanningGuideView", () => {
  const entry = getProductDocumentationEntry("improvement-planning");

  it("renders breadcrumb, provenance, feedback precondition, readingBody, and claim discipline", () => {
    if (entry === undefined) {
      throw new Error("Expected improvement-planning documentation entry.");
    }

    render(<HelpImprovementPlanningGuideView entry={entry} />);

    expect(screen.getByTestId("help-improvement-planning-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(breadcrumb).toHaveTextContent(HELP_TOPIC_BREADCRUMB_HUB_LABEL);
    expect(screen.getByRole("link", { name: HELP_TOPIC_BREADCRUMB_HUB_LABEL })).toHaveAttribute("href", "/help");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Last reviewed 2026-08-13 · insights improvement planning orientation",
    );
    expect(screen.getByTestId("help-improvement-planning-feedback-precondition")).toHaveTextContent(
      IMPROVEMENT_PLANNING_HELP_FEEDBACK_PRECONDITION,
    );
    expect(screen.getByTestId("help-improvement-planning-feedback-precondition-tag")).toHaveTextContent(
      IMPROVEMENT_PLANNING_HELP_FEEDBACK_PRECONDITION_TAG,
    );
    expect(screen.getByTestId("help-improvement-planning-claim-discipline").textContent).toContain(
      IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("help-improvement-planning-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-improvement-planning-overview").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByRole("link", { name: IMPROVEMENT_PLANNING_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      IMPROVEMENT_PLANNING_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: IMPROVEMENT_PLANNING_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: IMPROVEMENT_PLANNING_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What improvement planning shows" }).className).toContain(
      OPERATOR_TYPOGRAPHY.sectionTitle.split(" ")[0],
    );
    expect(screen.getByRole("heading", { name: "What planning returns" })).toBeInTheDocument();

    for (const item of IMPROVEMENT_PLANNING_HELP_SHOW_TILE_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }

    for (const item of IMPROVEMENT_PLANNING_HELP_OUTPUT_TILE_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }

    for (const source of IMPROVEMENT_PLANNING_HELP_SOURCES) {
      const linkName = source.adminOnly === true ? new RegExp(source.label, "i") : source.label;
      expect(screen.getByRole("link", { name: linkName })).toHaveAttribute("href", source.href);
    }
  });
});
