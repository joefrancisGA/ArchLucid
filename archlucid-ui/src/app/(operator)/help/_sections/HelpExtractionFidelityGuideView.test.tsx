import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpExtractionFidelityGuideView } from "@/app/(operator)/help/_sections/HelpExtractionFidelityGuideView";
import { LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_CLAIM_DISCIPLINE } from "@/lib/livelihood-grade-no-help-extraction-fidelity-evidence-copy";
import {
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_GUIDE_HEADINGS,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_HELP_RETURN,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PAGE_SUBTITLE,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RELATED_TOPICS,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_TITLE,
} from "@/lib/livelihood-grade-no-help-extraction-fidelity-guide-content";
import {
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SKIP_LINK_LABEL,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SKIP_TARGET_ID,
} from "@/lib/livelihood-grade-no-help-extraction-fidelity-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { LIVELIHOOD_GRADE_NO_EXTRACTION_PROVENANCE_ROWS } from "@/lib/livelihood-grade-no-extraction-provenance-inventory";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpExtractionFidelityGuideView (LN-034 / EEX Phase 2)", () => {
  const entry = getProductDocumentationEntry("extraction-fidelity");

  it("renders provenance, skip link, safety callout, gap table, enforcement links, and no sponsor send panel", () => {
    if (entry === undefined) {
      throw new Error("Expected extraction-fidelity documentation entry.");
    }

    render(<HelpExtractionFidelityGuideView entry={entry} markdown="# discarded" />);

    expect(screen.getByTestId("help-extraction-fidelity-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-extraction-fidelity-page-title")).toHaveTextContent(
      LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_TITLE,
    );
    expect(screen.getByText(LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-09-12");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("LN-034");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("ADR 0082");
    expect(screen.getByTestId("help-extraction-fidelity-header-claim-discipline")).toHaveTextContent(
      LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_CLAIM_DISCIPLINE,
    );
    expect(screen.getByRole("link", { name: LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-extraction-fidelity-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.queryByText("# discarded")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-extraction-fidelity-honesty-panel")).not.toBeInTheDocument();
    expect(screen.queryByText(/Before sponsor send/i)).not.toBeInTheDocument();

    expect(screen.getByTestId("help-extraction-fidelity-safety-callout")).toHaveTextContent("NotVerifiable");
    expect(screen.getByTestId("help-extraction-fidelity-seat-working")).toHaveTextContent("FindingId");

    for (const heading of LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_GUIDE_HEADINGS) {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent(heading.title);
    }

    const table = screen.getByTestId("help-extraction-fidelity-provenance-gap-table");
    expect(within(table).getAllByRole("row").length).toBe(LIVELIHOOD_GRADE_NO_EXTRACTION_PROVENANCE_ROWS.length + 1);

    const enforcement = screen.getByTestId("help-extraction-fidelity-enforcement-surfaces");
    expect(within(enforcement).getByRole("link", { name: "Evidence source inspect (ESI)" })).toHaveAttribute(
      "href",
      "/help/inspect-stored-evidence",
    );

    const related = screen.getByTestId("help-extraction-fidelity-related-topics");
    for (const topic of LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RELATED_TOPICS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-extraction-fidelity-return-to-help")).toHaveAttribute(
      "href",
      LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_HELP_RETURN.href,
    );

    expect(screen.getByTestId("help-extraction-fidelity-adr-mapping")).toHaveTextContent("ADR 0082");
  });
});
