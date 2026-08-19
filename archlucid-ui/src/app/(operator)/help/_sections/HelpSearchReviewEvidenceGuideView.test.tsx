import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

import { HelpSearchReviewEvidenceGuideView } from "@/app/(operator)/help/_sections/HelpSearchReviewEvidenceGuideView";
import {
  SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE,
  SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE_HEADING,
  SEARCH_REVIEW_EVIDENCE_HELP_SOURCES,
} from "@/lib/search-review-evidence-help-evidence-copy";
import {
  SEARCH_REVIEW_EVIDENCE_HELP_BREADCRUMB_TOPIC_TITLE,
  SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_HEADING_ID,
  SEARCH_REVIEW_EVIDENCE_HELP_EXAMPLE_QUERY,
  SEARCH_REVIEW_EVIDENCE_HELP_FEATURE_ITEMS,
  SEARCH_REVIEW_EVIDENCE_HELP_GUIDE_HEADINGS,
  SEARCH_REVIEW_EVIDENCE_HELP_HIT_ANATOMY_FIELDS,
  SEARCH_REVIEW_EVIDENCE_HELP_INDEXED_ROWS,
  SEARCH_REVIEW_EVIDENCE_HELP_NEGATION_DRIFT_MARKERS,
  SEARCH_REVIEW_EVIDENCE_HELP_PAGE_EYEBROW,
  SEARCH_REVIEW_EVIDENCE_HELP_PRECONDITION,
  SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_ACTION,
  SEARCH_REVIEW_EVIDENCE_HELP_START_HERE_CARD_TITLE,
  SEARCH_REVIEW_EVIDENCE_HELP_WHAT_IS_INDEXED_TITLE,
} from "@/lib/search-review-evidence-help-guide-content";
import { SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL } from "@/lib/search-review-evidence-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

describe("HelpSearchReviewEvidenceGuideView", () => {
  const entry = getProductDocumentationEntry("search-review-evidence");

  it("renders provenance, breadcrumb, eyebrow, precondition, indexed scope, hit anatomy, claim discipline, and wrap sources", () => {
    if (entry === undefined) {
      throw new Error("Expected search-review-evidence documentation entry.");
    }

    render(<HelpSearchReviewEvidenceGuideView entry={entry} />);

    expect(screen.getByTestId("help-search-review-evidence-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent(
      SEARCH_REVIEW_EVIDENCE_HELP_BREADCRUMB_TOPIC_TITLE,
    );
    expect(screen.getByTestId("page-heading-eyebrow")).toHaveTextContent(SEARCH_REVIEW_EVIDENCE_HELP_PAGE_EYEBROW);
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-08-13");
    expect(screen.getByTestId("help-search-review-evidence-precondition")).toHaveTextContent(
      SEARCH_REVIEW_EVIDENCE_HELP_PRECONDITION,
    );
    expect(screen.queryByTestId("help-search-review-evidence-start-here-scope-note")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-search-review-evidence-index-scope-note")).not.toBeInTheDocument();
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
    expect(screen.getByTestId("help-search-review-evidence-action-panel")).toHaveTextContent(
      SEARCH_REVIEW_EVIDENCE_HELP_START_HERE_CARD_TITLE,
    );
    expect(screen.getByRole("heading", { name: SEARCH_REVIEW_EVIDENCE_HELP_WHAT_IS_INDEXED_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL })).toBeInTheDocument();
    expect(screen.getByTestId("help-search-review-evidence-how-stepper").textContent).toContain(
      SEARCH_REVIEW_EVIDENCE_HELP_EXAMPLE_QUERY,
    );

    const indexedRegion = within(screen.getByTestId("help-search-review-evidence-indexed-rows"));

    for (const row of SEARCH_REVIEW_EVIDENCE_HELP_INDEXED_ROWS) {
      expect(indexedRegion.getByText(row.term)).toBeInTheDocument();
      expect(indexedRegion.getByText(row.detail)).toBeInTheDocument();
    }

    const featureRegion = within(screen.getByTestId("help-search-review-evidence-feature-items"));

    for (const item of SEARCH_REVIEW_EVIDENCE_HELP_FEATURE_ITEMS) {
      if (item.href === undefined) {
        expect(featureRegion.queryByRole("link", { name: item.label })).not.toBeInTheDocument();
        expect(featureRegion.getByText(item.label)).toBeInTheDocument();
      } else {
        expect(featureRegion.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
      }
    }

    expect(
      featureRegion.queryByRole("link", { name: "Hit navigation", exact: true }),
    ).not.toBeInTheDocument();
    expect(
      featureRegion.queryByRole("link", { name: "Evidence trail help", exact: true }),
    ).not.toBeInTheDocument();

    const anatomyRegion = within(screen.getByTestId("help-search-review-evidence-hit-anatomy"));

    for (const field of SEARCH_REVIEW_EVIDENCE_HELP_HIT_ANATOMY_FIELDS) {
      expect(anatomyRegion.getByText(field.label)).toBeInTheDocument();
      expect(anatomyRegion.getByText(field.description)).toBeInTheDocument();
    }

    const sourcesRegion = within(screen.getByTestId("help-search-review-evidence-sources"));

    for (const source of SEARCH_REVIEW_EVIDENCE_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(sourcesRegion.getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);

      if (source.when !== undefined) {
        expect(sourcesRegion.getByText(source.when)).toBeInTheDocument();
      }
    }

    expect(screen.queryByRole("link", { name: "Open evidence graph →" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ask review questions →" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open findings queue →" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Search review evidence", hidden: true })).not.toBeInTheDocument();
    expect(sourcesRegion.getByRole("link", { name: "Read Evidence trail help" })).toHaveAttribute(
      "href",
      inAppHelpHref("evidence-trail"),
    );

    for (const heading of SEARCH_REVIEW_EVIDENCE_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { name: heading.title })).toHaveAttribute("id", heading.id);
    }
  });
});
