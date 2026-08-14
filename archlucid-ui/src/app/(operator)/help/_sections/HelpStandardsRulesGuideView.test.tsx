import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpStandardsRulesGuideView } from "@/app/(operator)/help/_sections/HelpStandardsRulesGuideView";
import {
  STANDARDS_RULES_HELP_CLAIM_HEADING_ID,
  STANDARDS_RULES_HELP_GUIDE_HEADINGS,
  STANDARDS_RULES_HELP_PAGE_SUBTITLE,
  STANDARDS_RULES_HELP_PRIMARY_ACTION,
  STANDARDS_RULES_HELP_START_HERE_CARD_TITLE,
  STANDARDS_RULES_HELP_TABLE_ITEMS,
} from "@/lib/standards-rules-help-guide-content";
import {
  STANDARDS_RULES_HELP_CLAIM_DISCIPLINE,
  STANDARDS_RULES_HELP_CLAIM_DISCIPLINE_HEADING,
  STANDARDS_RULES_HELP_SOURCES,
} from "@/lib/standards-rules-help-evidence-copy";
import { STANDARDS_RULES_PAGE_SUBTITLE } from "@/lib/standards-rules-page";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpStandardsRulesGuideView", () => {
  const entry = getProductDocumentationEntry("standards-and-rules");

  it("renders provenance, start-here card, readingBody, and deduped follow-ups", () => {
    if (entry === undefined) {
      throw new Error("Expected standards-and-rules documentation entry.");
    }

    render(<HelpStandardsRulesGuideView entry={entry} />);

    expect(screen.getByTestId("help-standards-rules-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Last reviewed 2026-08-13 · governance standards and rules orientation",
    );
    expect(STANDARDS_RULES_HELP_PAGE_SUBTITLE).not.toBe(STANDARDS_RULES_PAGE_SUBTITLE);
    expect(screen.getByTestId("help-standards-rules-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-standards-rules-claim-discipline").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByTestId("help-standards-rules-claim-discipline").textContent).toContain(
      STANDARDS_RULES_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: STANDARDS_RULES_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      STANDARDS_RULES_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByRole("link", { name: STANDARDS_RULES_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      STANDARDS_RULES_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: STANDARDS_RULES_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: STANDARDS_RULES_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(STANDARDS_RULES_HELP_START_HERE_CARD_TITLE).not.toBe(STANDARDS_RULES_HELP_PRIMARY_ACTION.label);
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();

    for (const item of STANDARDS_RULES_HELP_TABLE_ITEMS) {
      if (item.href === undefined) {
        continue;
      }

      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }

    for (const source of STANDARDS_RULES_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    expect(screen.getAllByRole("link", { name: "Policy packs help" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Policy packs" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: STANDARDS_RULES_HELP_PRIMARY_ACTION.label })).toHaveLength(1);

    for (const heading of STANDARDS_RULES_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
