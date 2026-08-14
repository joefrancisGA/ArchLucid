import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpSearchReviewEvidenceGuideView } from "@/app/(operator)/help/_sections/HelpSearchReviewEvidenceGuideView";
import {
  SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE,
  SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE_HEADING,
  SEARCH_REVIEW_EVIDENCE_HELP_SOURCES,
} from "@/lib/search-review-evidence-help-evidence-copy";
import {
  SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_HEADING_ID,
  SEARCH_REVIEW_EVIDENCE_HELP_GUIDE_HEADINGS,
  SEARCH_REVIEW_EVIDENCE_HELP_NEGATION_DRIFT_MARKERS,
  SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_ACTION,
  SEARCH_REVIEW_EVIDENCE_HELP_START_HERE_CARD_TITLE,
  SEARCH_REVIEW_EVIDENCE_HELP_START_HERE_SCOPE_NOTE,
  SEARCH_REVIEW_EVIDENCE_HELP_FEATURE_ITEMS,
} from "@/lib/search-review-evidence-help-guide-content";
import { SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL } from "@/lib/search-review-evidence-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpSearchReviewEvidenceGuideView", () => {
  const entry = getProductDocumentationEntry("search-review-evidence");

  it("renders provenance, role precondition, readingBody, claim discipline, and stacked sources", () => {
    if (entry === undefined) {
      throw new Error("Expected search-review-evidence documentation entry.");
    }

    render(<HelpSearchReviewEvidenceGuideView entry={entry} />);

    expect(screen.getByTestId("help-search-review-evidence-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Last reviewed 2026-08-13 · insights search review evidence orientation",
    );
    expect(screen.getByTestId("help-search-review-evidence-start-here-scope-note")).toHaveTextContent(
      SEARCH_REVIEW_EVIDENCE_HELP_START_HERE_SCOPE_NOTE,
    );
    expect(screen.queryByTestId("help-search-review-evidence-role-precondition-tag")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-search-review-evidence-claim-discipline").textContent).toContain(
      SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("help-search-review-evidence-claim-discipline").textContent?.toLowerCase()).not.toContain(
      "signed review evidence",
    );
    expect(screen.getByRole("heading", { name: SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByTestId("help-search-review-evidence-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-search-review-evidence-overview").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    for (const phrase of SEARCH_REVIEW_EVIDENCE_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(screen.getByTestId("help-search-review-evidence-overview").textContent).not.toContain(phrase);
    }
    expect(screen.getByRole("link", { name: SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: SEARCH_REVIEW_EVIDENCE_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL })).toBeInTheDocument();

    for (const item of SEARCH_REVIEW_EVIDENCE_HELP_FEATURE_ITEMS) {
      expect(within(screen.getByTestId("help-search-review-evidence-feature-items")).getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        item.href,
      );
    }

    for (const source of SEARCH_REVIEW_EVIDENCE_HELP_SOURCES) {
      const sourcesRegion = within(screen.getByTestId("help-search-review-evidence-sources"));
      expect(sourcesRegion.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    expect(screen.queryByRole("link", { name: "Open evidence graph →" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ask review questions →" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open findings queue →" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Search review evidence", hidden: true })).not.toBeInTheDocument();

    for (const heading of SEARCH_REVIEW_EVIDENCE_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { name: heading.title })).toHaveAttribute("id", heading.id);
    }
  });
});
