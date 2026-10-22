import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpCareerRehearsalGuideView } from "@/app/(operator)/help/_sections/HelpCareerRehearsalGuideView";
import { CAREER_REHEARSAL_HELP_CLAIM_DISCIPLINE } from "@/lib/career-rehearsal-help-evidence-copy";
import {
  CAREER_REHEARSAL_HELP_GUIDE_HEADINGS,
  CAREER_REHEARSAL_HELP_HELP_RETURN,
  CAREER_REHEARSAL_HELP_KEYBOARD_SHORTCUT_BODY,
  CAREER_REHEARSAL_HELP_PAGE_TITLE,
  CAREER_REHEARSAL_HELP_RELATED_TOPICS,
  CAREER_REHEARSAL_HELP_SIBLING_TOPIC_LABEL,
} from "@/lib/career-rehearsal-help-guide-content";
import {
  CAREER_REHEARSAL_HELP_SKIP_LINK_LABEL,
  CAREER_REHEARSAL_HELP_SKIP_TARGET_ID,
} from "@/lib/career-rehearsal-help-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpCareerRehearsalGuideView (AS-082 / ECX Phase 2)", () => {
  const entry = getProductDocumentationEntry("career-vs-rehearsal");

  it("renders provenance, skip link, claim discipline, comparison table, shortcuts, sibling link, and sponsor panel", () => {
    if (entry === undefined) {
      throw new Error("Expected career-vs-rehearsal documentation entry.");
    }

    render(<HelpCareerRehearsalGuideView entry={entry} markdown="# discarded" />);

    expect(screen.getByTestId("help-career-vs-rehearsal-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-career-vs-rehearsal-page-title")).toHaveTextContent(
      CAREER_REHEARSAL_HELP_PAGE_TITLE,
    );
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-09-10");
    expect(screen.getByTestId("help-career-vs-rehearsal-header-claim-discipline")).toHaveTextContent(
      CAREER_REHEARSAL_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.getByRole("link", { name: CAREER_REHEARSAL_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${CAREER_REHEARSAL_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-career-vs-rehearsal-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.queryByText("# discarded")).not.toBeInTheDocument();

    for (const heading of CAREER_REHEARSAL_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: heading.level, name: heading.title })).toHaveAttribute(
        "id",
        heading.id,
      );
    }

    expect(screen.getByTestId("help-career-vs-rehearsal-comparison-table")).toBeInTheDocument();
    expect(screen.getByTestId("help-career-vs-rehearsal-comparison-row-technical-id")).toHaveTextContent("career");
    expect(screen.getByTestId("help-career-vs-rehearsal-comparison-row-technical-id")).toHaveTextContent("rehearsal");
    expect(screen.getByTestId("help-career-vs-rehearsal-technical-mapping")).toHaveTextContent("ADR 0086");
    expect(screen.getByTestId("help-career-vs-rehearsal-keyboard-shortcut")).toHaveTextContent(
      CAREER_REHEARSAL_HELP_KEYBOARD_SHORTCUT_BODY,
    );
    expect(screen.getByTestId("help-career-vs-rehearsal-mid-analysis")).toHaveTextContent(/in-flight/i);

    const sibling = screen.getByTestId("help-career-vs-rehearsal-sibling-topic");
    expect(within(sibling).getByRole("link", { name: `${CAREER_REHEARSAL_HELP_SIBLING_TOPIC_LABEL} →` })).toHaveAttribute(
      "href",
      "/help/career-rehearsal-doors",
    );

    const related = screen.getByTestId("help-career-vs-rehearsal-related-topics");
    for (const topic of CAREER_REHEARSAL_HELP_RELATED_TOPICS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-career-vs-rehearsal-return-to-help")).toHaveAttribute(
      "href",
      CAREER_REHEARSAL_HELP_HELP_RETURN.href,
    );

    const relatedSection = screen.getByTestId("help-career-vs-rehearsal-related-topics");
    const sponsorPanel = screen.getByTestId("help-career-vs-rehearsal-honesty-panel");
    expect(relatedSection.compareDocumentPosition(sponsorPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

  });
});
