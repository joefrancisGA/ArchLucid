import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SearchReviewEvidenceClaimOrientationStrip } from "./SearchReviewEvidenceClaimOrientationStrip";
import {
  SEARCH_REVIEW_EVIDENCE_CLAIM_DISCIPLINE,
  SEARCH_REVIEW_EVIDENCE_CLAIM_HEADING,
  SEARCH_REVIEW_EVIDENCE_SOURCES_INTRO,
} from "@/lib/search-review-evidence-evidence-copy";

describe("SearchReviewEvidenceClaimOrientationStrip", () => {
  it("mounts claim discipline and sources for search review evidence", () => {
    render(<SearchReviewEvidenceClaimOrientationStrip />);

    expect(screen.getByTestId("search-review-evidence-orientation")).toBeInTheDocument();
    expect(screen.getByText(SEARCH_REVIEW_EVIDENCE_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(SEARCH_REVIEW_EVIDENCE_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.getByText(SEARCH_REVIEW_EVIDENCE_SOURCES_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId("search-review-evidence-sources")).toBeInTheDocument();
  });
});
