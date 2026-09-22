import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpFalseHardInfeasibilityGuideView } from "@/app/(operator)/help/_sections/HelpFalseHardInfeasibilityGuideView";
import { HARD_INFEASIBLE_MISSING_CITATION_EXPORT_BLOCKED_REASON } from "@/lib/feasibility/feasibility-verdict-citation";
import { LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_CLAIM_DISCIPLINE } from "@/lib/livelihood-grade-no-help-false-hard-evidence-copy";
import {
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_GUIDE_HEADINGS,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_HELP_RETURN,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_KEYBOARD_SHORTCUTS_HREF,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PAGE_SCOPE,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_RELATED_TOPICS,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_TITLE,
} from "@/lib/livelihood-grade-no-help-false-hard-guide-content";
import {
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_GUIDE_TEST_ID,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SKIP_LINK_LABEL,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SKIP_TARGET_ID,
} from "@/lib/livelihood-grade-no-help-false-hard-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS } from "@/lib/livelihood-grade-no-hard-infeasible-inventory";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpFalseHardInfeasibilityGuideView (LN-024 / HEF Phase 2)", () => {
  const entry = getProductDocumentationEntry("false-hard-infeasibility");

  it("renders provenance, skip link, scope, vocabulary, enforcement inventory, shortcuts, and sponsor panel after topics", () => {
    if (entry === undefined) {
      throw new Error("Expected false-hard-infeasibility documentation entry.");
    }

    render(<HelpFalseHardInfeasibilityGuideView entry={entry} markdown="# discarded" />);

    expect(screen.getByTestId(LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_GUIDE_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("help-false-hard-infeasibility-page-title")).toHaveTextContent(
      LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_TITLE,
    );
    expect(screen.getByTestId("help-false-hard-infeasibility-page-scope")).toHaveTextContent(
      LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PAGE_SCOPE,
    );
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-09-12");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("LN-024");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("ADR 0093");
    expect(screen.getByTestId("help-false-hard-infeasibility-header-claim-discipline")).toHaveTextContent(
      LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_CLAIM_DISCIPLINE,
    );
    expect(screen.getByRole("link", { name: LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-false-hard-infeasibility-overview").className).toContain(
      HELP_PAGE_LAYOUT.readingBody,
    );
    expect(screen.queryByText("# discarded")).not.toBeInTheDocument();

    for (const heading of LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_GUIDE_HEADINGS) {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent(heading.title);
    }

    expect(screen.getByTestId("help-false-hard-infeasibility-safety-callout")).toHaveTextContent("HardInfeasible");
    expect(screen.getByTestId("help-false-hard-infeasibility-seat-working")).toHaveTextContent("FindingId");
    expect(screen.getByTestId("help-false-hard-infeasibility-seat-door")).toHaveTextContent("Record");

    const remediation = screen.getByTestId("help-false-hard-infeasibility-citation-remediation");
    expect(remediation).toHaveTextContent(HARD_INFEASIBLE_MISSING_CITATION_EXPORT_BLOCKED_REASON);

    const enforcementTable = screen.getByTestId("help-false-hard-infeasibility-enforcement-table");
    expect(within(enforcementTable).getAllByRole("row").length).toBe(LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS.length + 1);

    expect(screen.getByTestId("help-false-hard-infeasibility-open-keyboard-shortcuts")).toHaveAttribute(
      "href",
      LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_KEYBOARD_SHORTCUTS_HREF,
    );

    const related = screen.getByTestId("help-false-hard-infeasibility-related-topics");
    for (const topic of LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_RELATED_TOPICS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-false-hard-infeasibility-return-to-help")).toHaveAttribute(
      "href",
      LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_HELP_RETURN.href,
    );

    expect(screen.getByTestId("help-false-hard-infeasibility-adr-mapping")).toHaveTextContent("ADR 0093");

    const relatedSection = screen.getByTestId("help-false-hard-infeasibility-related-topics");
    const sponsorPanel = screen.getByTestId("help-false-hard-infeasibility-honesty-panel");
    expect(relatedSection.compareDocumentPosition(sponsorPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
