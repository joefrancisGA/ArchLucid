import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpSearchReviewEvidenceGuideView } from "@/app/(operator)/help/_sections/HelpSearchReviewEvidenceGuideView";
import { SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE } from "@/lib/search-review-evidence-help-evidence-copy";
import {
  SEARCH_REVIEW_EVIDENCE_HELP_PAGE_SUBTITLE,
  SEARCH_REVIEW_EVIDENCE_HELP_PAGE_SUBTITLE_BUYER,
  SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_CONTENT_ID,
  SEARCH_REVIEW_EVIDENCE_HELP_SKIP_LINK_LABEL,
} from "@/lib/search-review-evidence-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpSearchReviewEvidenceGuideView buyer-polished shell", () => {
  const entry = getProductDocumentationEntry("search-review-evidence");

  it("renders skip link, buyer subtitle, orientation above overview, and hides registry provenance", () => {
    if (entry === undefined) {
      throw new Error("Expected search-review-evidence documentation entry.");
    }

    render(<HelpSearchReviewEvidenceGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: SEARCH_REVIEW_EVIDENCE_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByText(SEARCH_REVIEW_EVIDENCE_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(SEARCH_REVIEW_EVIDENCE_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-search-review-evidence-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("help-search-review-evidence-claim-discipline").textContent).toContain(
      SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );

    const orientationTop = screen.getByTestId("help-search-review-evidence-orientation-top");
    const overview = screen.getByTestId("help-search-review-evidence-overview");

    expect(orientationTop.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
